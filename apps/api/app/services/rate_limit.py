import time
from collections import defaultdict, deque
from threading import Lock
from typing import Callable

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Limite em memória por janela deslizante, chaveado pelo IP do cliente.

    Suficiente para uma instância única da API; com várias réplicas seria
    necessário um armazenamento compartilhado (ex.: Redis).
    """

    def __init__(self, nome: str, limite: Callable[[], int], janela: Callable[[], int]):
        self.nome = nome
        self._limite = limite
        self._janela = janela
        self._acessos: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def reset(self) -> None:
        with self._lock:
            self._acessos.clear()

    def __call__(self, request: Request) -> None:
        limite = self._limite()
        if limite <= 0:
            return
        janela = self._janela()
        cliente = request.client.host if request.client else "desconhecido"
        agora = time.monotonic()
        with self._lock:
            fila = self._acessos[cliente]
            while fila and agora - fila[0] > janela:
                fila.popleft()
            if len(fila) >= limite:
                espera = int(janela - (agora - fila[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas. Aguarde um pouco e tente novamente.",
                    headers={"Retry-After": str(espera)},
                )
            fila.append(agora)
