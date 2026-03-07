import frappe

def inspect():
    dt = "Intranet Training Provider"
    if not frappe.db.exists("DocType", dt):
        print(f"{dt} not found in DB")
        return

    res = frappe.db.sql(f"""
        SELECT name, module, custom, app, is_virtual
        FROM `tabDocType`
        WHERE name = '{dt}'
    """, as_dict=True)[0]
    
    print(f"DB Record for {dt}:")
    print(res)
    
    # Check if module def exists
    mod_def = frappe.db.exists("Module Def", res.module)
    print(f"Module '{res.module}' exists: {mod_def}")
    
    # Check what Python thinks
    try:
        from frappe.modules import load_doctype_module
        mod = load_doctype_module(dt)
        print(f"Loaded module: {mod}")
    except Exception as e:
        print(f"Failed to load module: {e}")

