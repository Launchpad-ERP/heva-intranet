# Copyright (c) 2026, Launchpad ERP and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class IntranetTravelExpense(Document):
	def validate(self):
		self.calculate_totals()

	def calculate_totals(self):
		self.total_amount = 0
		if self.expense_items:
			for item in self.expense_items:
				self.total_amount += (item.amount or 0)

