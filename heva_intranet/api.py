import frappe
import json
from heva_intranet.training_scraper import fetch_trainings

@frappe.whitelist()
def update_time_entry(name, data):
    """
    Update a Time Entry and process calculate_working_hours via save().
    data should be a JSON string of fields to update.
    """
    if isinstance(data, str):
        data = json.loads(data)
        
    doc = frappe.get_doc("Intranet Time Entry", name)
    for k, v in data.items():
        if doc.meta.has_field(k):
            setattr(doc, k, v)
    
    doc.save(ignore_permissions=False)
    return doc.as_dict()

@frappe.whitelist()
def sync_trainings():
    """
    Whitelisted API to trigger training sync from frontend.
    """
    # Permission check (only for Intranet Admin)
    # The frontend only shows the sync button to admins, 
    # but we should still check here for security.
    if not frappe.has_permission("Role", "read", "Intranet Admin"):
        # Fallback to Administrator
        if frappe.session.user != 'Administrator':
            frappe.throw("No permission to sync trainings", frappe.PermissionError)

    try:
        fetch_trainings()
        return {"status": "success", "message": "Trainings synchronized successfully."}
    except Exception as e:
        frappe.log_error(f"Error in sync_trainings API: {str(e)}", "Training Sync API")
        frappe.throw(f"Synchronization failed: {str(e)}")
