from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/api/v1/projects/proj-uuid-1/blueprints")
print("STATUS:", response.status_code)
print("BODY:", response.text)
