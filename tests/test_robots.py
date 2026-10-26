import os
import sys

# Ensure project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from src.api import app


def test_robots_txt_and_headers():
    client = TestClient(app)

    # 1. GET /robots.txt returns 200 and contains "Disallow: /"
    robots_res = client.get("/robots.txt")
    assert robots_res.status_code == 200, f"Expected 200, got {robots_res.status_code}"
    assert "Disallow: /" in robots_res.text, f"Expected 'Disallow: /' in {robots_res.text}"
    assert "User-agent: *" in robots_res.text, f"Expected 'User-agent: *' in {robots_res.text}"
    assert robots_res.headers.get("content-type", "").startswith("text/plain"), (
        f"Expected text/plain, got {robots_res.headers.get('content-type')}"
    )

    # 2. GET /, /openapi.json, /app-ads.txt, and non-existent path return X-Robots-Tag: noindex, nofollow
    # Also verify existing security headers remain intact
    endpoints_to_check = ["/", "/openapi.json", "/app-ads.txt", "/robots.txt", "/non-existent-route-404"]
    for path in endpoints_to_check:
        res = client.get(path)
        tag = res.headers.get("x-robots-tag")
        assert tag == "noindex, nofollow", (
            f"Endpoint {path} (status {res.status_code}) expected 'X-Robots-Tag: noindex, nofollow', got: {tag}"
        )
        assert res.headers.get("x-content-type-options") == "nosniff", f"Missing X-Content-Type-Options on {path}"
        assert res.headers.get("x-frame-options") == "DENY", f"Missing X-Frame-Options on {path}"
        assert res.headers.get("content-security-policy") == "default-src 'none'", f"Missing CSP on {path}"

    # 3. /app-ads.txt returns original content
    ads_res = client.get("/app-ads.txt")
    assert ads_res.status_code == 200, f"Expected 200, got {ads_res.status_code}"
    assert ads_res.text == "google.com, pub-8109255880447388, DIRECT, f08c47fec0942fa0"

    # 4. GET /robots.txt is excluded from schema
    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    schema = openapi_res.json()
    assert "/robots.txt" not in schema.get("paths", {}), "Expected /robots.txt to be omitted from OpenAPI schema"
    assert "/app-ads.txt" in schema.get("paths", {}), "Expected /app-ads.txt to remain in OpenAPI schema"

    # 5. Verify CORS headers work
    cors_res = client.options(
        "/",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert cors_res.headers.get("access-control-allow-origin") in ["*", "https://example.com"], (
        f"CORS header missing or incorrect: {cors_res.headers}"
    )

    print("[PASS] All robots.txt, X-Robots-Tag, security headers, and app-ads.txt tests passed!")


if __name__ == "__main__":
    test_robots_txt_and_headers()
