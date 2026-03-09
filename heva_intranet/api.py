import frappe
from heva_intranet.training_scraper import fetch_trainings

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
