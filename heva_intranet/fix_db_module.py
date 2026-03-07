import frappe

def execute():
    print("Fixing DocType modules in database...")
    
    # Update the module field for the affected DocTypes
    # This forces them to point to 'Heva Intranet' instead of 'Intranet' (which was resolving to core)
    doctypes = ['Intranet Training Provider', 'Intranet External Training', 'Intranet Training Request']
    
    for dt in doctypes:
        current_module = frappe.db.get_value("DocType", dt, "module")
        print(f"Current module for {dt}: {current_module}")
        
        frappe.db.sql("""
            UPDATE `tabDocType`
            SET module = 'Heva Intranet'
            WHERE name = %s
        """, (dt,))
        
    frappe.db.commit()
    print("Successfully updated modules to 'Heva Intranet'.")
    print("Now please run: bench migrate")
