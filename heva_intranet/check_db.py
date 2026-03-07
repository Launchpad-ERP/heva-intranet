import frappe

def run():
    count = frappe.db.count("Intranet External Training")
    print(f"Total Trainings found: {count}")
    
    # Check if FSU trainings exist (provider='FSU eV')
    fsu_count = frappe.db.count("Intranet External Training", {"provider": "FSU eV"})
    print(f"FSU Trainings: {fsu_count}")

    # Check TUV
    tuv_count = frappe.db.count("Intranet External Training", {"provider": "TUV Rheinland"})
    print(f"TUV Trainings: {tuv_count}")
