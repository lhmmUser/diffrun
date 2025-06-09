from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()
GEO = os.getenv("GEO")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get-country")
def get_country(request: Request):
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    client_ip = client_ip.split(",")[0].strip()
    print(f"Client IP: {client_ip}")

    try:
        response = requests.get(f"https://ipinfo.io/{client_ip}/json?token={GEO}")
        response.raise_for_status()
        data = response.json()
        country_code = data.get("country")
        print(f"Geo detection result: {country_code}")
    except Exception as e:
        print(f"Geo detection failed: {e}")
        country_code = ""  
        
    return {"country_code": country_code}