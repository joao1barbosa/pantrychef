HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


def test_openapi_available(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200


def test_public_routes_documented(client):
    schema = client.get("/openapi.json").json()
    for path, operations in schema["paths"].items():
        for method, operation in operations.items():
            if method not in HTTP_METHODS:
                continue
            assert operation.get("summary"), f"sem summary: {method} {path}"
            assert operation.get("description"), f"sem description: {method} {path}"


def test_protected_routes_marked_secure(client):
    schema = client.get("/openapi.json").json()
    protected = schema["paths"]["/users/me"]["get"]
    assert "security" in protected
