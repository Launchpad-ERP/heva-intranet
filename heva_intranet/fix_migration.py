import frappe

def run():
    print("\n--- DIAGNOSTIC START ---")
    try:
        doc = frappe.get_doc("DocType", "Intranet Time Entry")
        
        # Print Current State
        print(f"DocType: {doc.name}")
        print(f"Autoname: {doc.autoname}")
        
        user_field = next((f for f in doc.fields if f.fieldname == 'user'), None)
        employee_field = next((f for f in doc.fields if f.fieldname == 'employee'), None)
        
        if user_field:
            print(f"Field 'user': found")
            print(f"  Label: {user_field.label}")
            print(f"  Options: {user_field.options}")
            print(f"  Default: {user_field.default}")
            print(f"  Reqd: {user_field.reqd}")
        else:
            print("Field 'user': NOT FOUND")

        if employee_field:
            print(f"Field 'employee': found")
            print(f"  Options: {employee_field.options}")
            print(f"  Default: {employee_field.default}")
        else:
            print("Field 'employee': NOT FOUND")

        # FIXING
        print("\n--- ATTEMPTING FIX ---")
        param_changed = False
        
        if doc.autoname != "ZB-.user.-.date":
            print(f"Updating autoname logic from '{doc.autoname}' to 'ZB-.user.-.date'...")
            doc.autoname = "ZB-.user.-.date"
            param_changed = True

        if not user_field and employee_field:
             print("Renaming 'employee' to 'user'...")
             employee_field.fieldname = "user"
             employee_field.label = "Mitarbeiter"
             employee_field.options = "User"
             employee_field.default = None
             param_changed = True
             user_field = employee_field # Reassign for later check

        if user_field:
            if user_field.options != "User":
                print(f"Updating options from '{user_field.options}' to 'User'...")
                user_field.options = "User"
                param_changed = True
            
            if user_field.default == "user":
                print("Removing invalid default value 'user'...")
                user_field.default = None
                param_changed = True
        
        if param_changed:
            doc.save()
            print("DocType saved.")
            frappe.db.commit()
            print("Changes committed.")
        else:
            print("No DocType changes needed.")

        # CLEANUP PROPERTY SETTERS
        print("\n--- CHECKING PROPERTY SETTERS ---")
        ps_list = frappe.get_all("Property Setter", filters={"doc_type": "Intranet Time Entry", "field_name": "user", "property": "default"})
        if ps_list:
            print(f"Found {len(ps_list)} Property Setters for user default! Deleting...")
            for ps in ps_list:
                frappe.delete_doc("Property Setter", ps.name)
            frappe.db.commit()
            print("Property Setters deleted.")
        else:
            print("No Property Setters found for user default.")

        # FINAL STATE
        print("\n--- FINAL STATE ---")
        # clear cache to ensure reload picks up DB changes
        frappe.clear_cache(doctype="Intranet Time Entry")
        doc = frappe.get_doc("DocType", "Intranet Time Entry") # Re-fetch to be sure
        print(f"Autoname: {doc.autoname}")
        u = next((f for f in doc.fields if f.fieldname == 'user'), None)
        if u:
            print(f"Field 'user': default='{u.default}' (Should be None or empty), options='{u.options}'")

    except Exception as e:
        print(f"ERROR: {e}")
        frappe.log_error(f"Fix Migration Error: {e}")
    print("--- DIAGNOSTIC END ---\n")

