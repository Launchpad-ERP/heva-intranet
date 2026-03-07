import frappe
import json
import os

def run():
    print("Manually installing DocTypes...")
    
    # Path relative to this script (heva_intranet/)
    base = os.path.join(os.path.dirname(__file__), "doctype")
    
    docs = [
        "intranet_training_provider",
        "intranet_external_training",
        "intranet_training_request"
    ]
    
    for d in docs:
        path = os.path.join(base, d, d + ".json")
        print(f"Reading {path}")
        if not os.path.exists(path):
            print(f"Error: {path} not found!")
            continue

        with open(path, "r") as f:
            data = json.load(f)
            
        # Ensure module is correct
        data["module"] = "Heva Intranet"
        # Remove timestamps to avoid conflicts
        data.pop("modified", None) 
        data.pop("creation", None)
        
        try:
            if frappe.db.exists("DocType", data["name"]):
                print(f"Updating: {data['name']}")
                doc = frappe.get_doc("DocType", data["name"])
                doc.update(data)
                doc.save()
            else:
                print(f"Inserting: {data['name']}")
                doc = frappe.get_doc(data)
                doc.insert()
        except Exception as e:
            print(f"Failed to process {data['name']}: {e}")
            import traceback
            traceback.print_exc()
            
    frappe.db.commit()
    print("DocTypes installed successfully.")
