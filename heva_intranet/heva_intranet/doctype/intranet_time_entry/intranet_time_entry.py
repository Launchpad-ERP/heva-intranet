# Copyright (c) 2026, Launchpad ERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class IntranetTimeEntry(Document):
	def validate(self):
		self.calculate_working_hours()

	def calculate_working_hours(self):
		if self.clock_in and self.clock_out:
			try:
				def get_sec(t):
					if not t: return 0
					t_str = str(t)
					if "day" in t_str:
						parts = t_str.split(',')
						days = int(parts[0].split()[0])
						t_str = parts[1].strip()
					else:
						days = 0
					
					pts = t_str.split(':')
					h = int(pts[0]) if len(pts) > 0 else 0
					m = int(pts[1]) if len(pts) > 1 else 0
					s = float(pts[2]) if len(pts) > 2 else 0
					return days * 86400 + h * 3600 + m * 60 + s

				in_sec = get_sec(self.clock_in)
				out_sec = get_sec(self.clock_out)

				if out_sec < in_sec:
					out_sec += 86400 # Handle spanning across midnight

				total_sec = out_sec - in_sec
				break_sec = float(self.break_duration or 0.0) * 3600

				working_sec = total_sec - break_sec
				if working_sec < 0:
					working_sec = 0

				self.working_hours = working_sec / 3600.0
			except Exception as e:
				frappe.log_error(f"Error calculating working hours: {str(e)}", "IntranetTimeEntry.calculate_working_hours")
		else:
			self.working_hours = 0.0
