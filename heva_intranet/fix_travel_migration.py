import frappe

def run():
    print("\n--- TRAVEL EXPENSE MIGRATION START ---")
    try:
        doc = frappe.get_doc("DocType", "Intranet Travel Expense")
        print(f"DocType: {doc.name}")
        
        user_field = next((f for f in doc.fields if f.fieldname == 'user'), None)
        employee_field = next((f for f in doc.fields if f.fieldname == 'employee'), None)
        
        param_changed = False
        
        # 1. Rename employee to user if needed
        if not user_field and employee_field:
            print("Renaming 'employee' field to 'user'...")
            employee_field.fieldname = "user"
            employee_field.label = "Mitarbeiter"
            employee_field.options = "User"
            param_changed = True
            user_field = employee_field
            
        # 2. Update user field properties
        if user_field:
            if user_field.options != "User":
                print(f"Updating options from '{user_field.options}' to 'User'...")
                user_field.options = "User"
                param_changed = True
            
            if user_field.label != "Mitarbeiter":
                 # Optional: Ensure common label
                 pass

        # 3. Convert Project and Customer to Data (Free Text)
        for fieldname in ['project', 'customer']:
            f = next((f for f in doc.fields if f.fieldname == fieldname), None)
            if f:
                if f.fieldtype != "Data":
                    print(f"Converting '{fieldname}' from {f.fieldtype} to Data...")
                    f.fieldtype = "Data"
                    f.options = "" # Clear options
                    param_changed = True

        # 4. Clean up Property Setters
        print("Checking Property Setters...")
        ps_list = frappe.get_all("Property Setter", filters={"doc_type": "Intranet Travel Expense", "field_name": ["in", ["user", "employee"]]})
        if ps_list:
            print(f"Found {len(ps_list)} Property Setters. Deleting to ensure clean state...")
            for ps in ps_list:
                frappe.delete_doc("Property Setter", ps.name)
            frappe.db.commit()
            print("Property Setters deleted.")

        if param_changed:
            doc.save()
            print("DocType saved.")
            frappe.db.commit()
            print("Changes committed.")
        else:
            print("No DocType changes needed.")

    except Exception as e:
        print(f"ERROR: {e}")
        frappe.log_error(f"Travel Migration Error: {e}")
    
    print("--- TRAVEL EXPENSE MIGRATION END ---\n")
