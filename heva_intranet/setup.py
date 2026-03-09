import frappe

def after_migrate():
    create_intranet_admin_role()

def create_intranet_admin_role():
    if not frappe.db.exists("Role", "Intranet Admin"):
        role = frappe.get_doc({
            "doctype": "Role",
            "role_name": "Intranet Admin",
            "desk_access": 0
        })
        role.insert(ignore_permissions=True)
        frappe.db.commit()
