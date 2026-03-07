import frappe
from frappe import _

@frappe.whitelist()
def send_batch_quote_request(training_name):
    """
    Collects all 'Requested' status requests for a specific training,
    sends one email to the provider, and updates status to 'Quote Requested'.
    """
    if not frappe.has_permission("Intranet Training Request", "write"):
        frappe.throw(_("No permission"))

    training = frappe.get_doc("Intranet External Training", training_name)
    provider = frappe.get_doc("Intranet Training Provider", training.provider)
    
    if not provider.contact_email:
        frappe.throw(_("Provider has no contact email"))

    # Fetch pending requests
    requests = frappe.get_all("Intranet Training Request", 
        filters={
            "training": training_name,
            "status": "Requested"
        },
        fields=["name", "employee", "notes"]
    )

    if not requests:
        frappe.throw(_("No pending requests found for this training"))

    # Build Email Content
    employee_list_html = """
    <table border="1" cellpadding="5" cellspacing="0">
        <tr>
            <th>Employee</th>
            <th>Notes</th>
        </tr>
    """
    
    employees_to_update = []
    
    for req in requests:
        emp_name = frappe.db.get_value("Employee", req.employee, "employee_name")
        employee_list_html += f"""
        <tr>
            <td>{emp_name} ({req.employee})</td>
            <td>{req.notes or ''}</td>
        </tr>
        """
        employees_to_update.append(req.name)

    employee_list_html += "</table>"

    subject = f"Angebotsanfrage für Schulung: {training.subject}"
    message = f"""
    <p>Sehr geehrte Damen und Herren,</p>
    <p>bitte senden Sie uns ein Angebot für folgende Schulung:</p>
    <p><b>{training.subject}</b><br>
    Datum: {training.date_text or 'N/A'}<br>
    Ort: {training.location or 'N/A'}</p>
    
    <p>Für folgende Mitarbeiter:</p>
    {employee_list_html}
    
    <p>Mit freundlichen Grüßen,<br>
    Heva GmbH</p>
    """

    # Send Email
    frappe.sendmail(
        recipients=[provider.contact_email],
        subject=subject,
        message=message,
        reference_doctype="Intranet External Training",
        reference_name=training.name
    )

    # Update Status
    for req_name in employees_to_update:
        frappe.db.set_value("Intranet Training Request", req_name, "status", "Quote Requested")

    return f"Email sent for {len(requests)} requests."
