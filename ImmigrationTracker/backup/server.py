import os
import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION ---
BASE_DIR = r"D:\ImmigrationCases" 
if not os.path.exists("D:\\"):
    BASE_DIR = os.path.join(os.getcwd(), "ImmigrationCases")

if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR)

def get_case_path(case_number):
    return os.path.join(BASE_DIR, case_number)

def get_status_file(case_number):
    return os.path.join(get_case_path(case_number), "status.json")

def create_case_structure(case_number):
    case_path = get_case_path(case_number)
    if not os.path.exists(case_path):
        os.makedirs(case_path)
        for folder in ["documents", "drafts", "signatures"]:
            os.makedirs(os.path.join(case_path, folder))
        
        initial_status = {
            "caseId": case_number,
            "exists": True,
            "currentLocation": "Dock Station",
            "attorney": "Unassigned",
            "paralegal": "Unassigned",
            "lastUpdated": datetime.now().isoformat()
        }
        with open(get_status_file(case_number), 'w') as f:
            json.dump(initial_status, f, indent=4)
        return initial_status
    return None

def read_status(case_number):
    status_path = get_status_file(case_number)
    if os.path.exists(status_path):
        with open(status_path, 'r') as f:
            return json.load(f)
    return None

@app.route('/case/<case_number>', methods=['GET'])
def get_case_status(case_number):
    case_number = os.path.basename(case_number)
    status = read_status(case_number)
    if not status:
        status = create_case_structure(case_number)
    return jsonify(status)

@app.route('/case/<case_number>/status', methods=['POST'])
def update_case_status(case_number):
    case_number = os.path.basename(case_number)
    data = request.json
    status = read_status(case_number)
    if not status:
        return jsonify({"error": "Case not found"}), 404

    if "status" in data: status["currentLocation"] = data["status"]
    status["lastUpdated"] = datetime.now().isoformat()
    
    with open(get_status_file(case_number), 'w') as f:
        json.dump(status, f, indent=4)
    return jsonify(status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)