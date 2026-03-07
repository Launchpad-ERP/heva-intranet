import frappe
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_trainings():
    """Scheduled job to fetch trainings from all providers."""
    print("Starting training scraper...")
    try:
        scrape_tuv()
    except Exception as e:
        print(f"Error in scrape_tuv: {e}")
        frappe.log_error(f"Error in scrape_tuv: {e}", "Training Scraper")

    try:
        scrape_fsu()
    except Exception as e:
        print(f"Error in scrape_fsu: {e}")
        frappe.log_error(f"Error in scrape_fsu: {e}", "Training Scraper")
    
    frappe.db.commit()
    print("Training scraper finished.")

def scrape_tuv():
    """Scrape trainings from akademie.tuv.com"""
    print("Scraping TUV...")
    provider_name = "TUV Rheinland"
    base_url = "https://akademie.tuv.com/themen/bau-gebaeude-immobilien/bauschaeden-bauschadstoffe"
    
    # Ensure provider exists
    provider = get_or_create_provider(provider_name, "https://akademie.tuv.com", "servicecenter@de.tuv.com")
    print(f"Provider: {provider.name}")
    
    # Pagination loop (limit to 5 pages for safety)
    for page in range(1, 6):
        target_url = f"{base_url}?p={page}&product_list_limit=25" if page > 1 else f"{base_url}?product_list_limit=25"
        print(f"Fetching {target_url}...")
        try:
            response = requests.get(target_url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            
            products = soup.find_all("li", class_="product-item")
            if not products:
                # Fallback
                products = soup.select(".product-item")
            
            print(f"Found {len(products)} products on page {page}")

            if products and page == 1:
                # print("First product HTML:")
                # print(products[0].prettify()[:500])
                pass # suppress verbose html
            
            first_product_title = products[0].find("a").get_text(strip=True) if products[0].find("a") else "Unknown"
            print(f"Page {page} first item: {first_product_title}")

            if not products:
                print(f"No products found on page {page}, stopping TUV scrape.")
                if page > 1: break

            for i, product in enumerate(products):
                try:
                    # Generic lookup for ANY link if class specific fails
                    link_tag = product.find("a", class_="product-item-link")
                    if not link_tag:
                        link_tag = product.find("a") # Fallback to first link
                    
                    if not link_tag:
                        print(f"Product {i}: No link tag found.")
                        continue
                    
                    url = link_tag.get("href")
                    title = link_tag.get_text(strip=True)
                    
                    # Fix relative URLs
                    if url.startswith("/"):
                        url = urljoin("https://akademie.tuv.com", url)
                        
                    # Price and Date often in sibling elements
                    price_box = product.find("span", class_="price")
                    price = price_box.get_text(strip=True) if price_box else "Auf Anfrage"
                    
                    # Create/Update Training
                    create_training(title, provider.name, url, price, description="")
                except Exception as e:
                    print(f"Error parsing product {i}: {e}")
                    frappe.log_error(f"Error parsing TUV product: {e}", "Training Scraper")
                    
        except Exception as e:
            print(f"Error scraping page {page}: {e}")
            frappe.log_error(f"Error scraping TUV page {page}: {e}", "Training Scraper")

def scrape_fsu():
    """Scrape trainings from fsu-ev.de"""
    print("Scraping FSU...")
    provider_name = "FSU eV"
    base_url = "https://fsu-ev.de/seminarueberblick/"
    
    # Ensure provider exists
    provider = get_or_create_provider(provider_name, "https://fsu-ev.de", "b.munk@fsu-ev.org")
    print(f"Provider: {provider.name}")
    
    try:
        print(f"Fetching {base_url}...")
        response = requests.get(base_url, headers=HEADERS, timeout=10)
        # response.raise_for_status() # Let's see status even if error
        print(f"Response: {response.status_code}")
        if response.status_code != 200:
             print(f"Failed to fetch FSU: {response.status_code}")
             return

        soup = BeautifulSoup(response.content, "html.parser")
        
        # Debug FSU output
        print("FSU HTML Preview:")
        print(soup.prettify()[:1000])

        rows = soup.find_all("tr")
        print(f"Found {len(rows)} rows")
        
        for row in rows:
            try:
                cols = row.find_all("td")
                if not cols or len(cols) < 2:
                    continue
                
                link = row.find("a")
                if not link:
                    continue
                
                title = link.get_text(strip=True)
                url = link.get("href")
                if url.startswith("/"):
                    url = urljoin("https://fsu-ev.de", url)
                    
                date_text = cols[0].get_text(strip=True)
                
                create_training(title, provider.name, url, "Siehe Website", description=f"Date: {date_text}")
                
            except Exception as e:
                pass 
                
    except Exception as e:
        print(f"Error FSU: {e}")
        frappe.log_error(f"Error scraping FSU: {e}", "Training Scraper")

def get_or_create_provider(name, url, email):
    if not frappe.db.exists("Intranet Training Provider", name):
        print(f"Creating provider: {name}")
        doc = frappe.get_doc({
            "doctype": "Intranet Training Provider",
            "provider_name": name,
            "base_url": url,
            "contact_email": email,
            "module": "Heva Intranet"
        })
        doc.insert(ignore_permissions=True)
        return doc
    return frappe.get_doc("Intranet Training Provider", name)

def create_training(subject, provider, url, price, description):
    if frappe.db.exists("Intranet External Training", {"url": url}):
        print(f"Skipping existing: {subject}")
        return
        
    print(f"Creating training: {subject}")
    doc = frappe.get_doc({
        "doctype": "Intranet External Training",
        "subject": subject,
        "provider": provider,
        "url": url,
        "price": price,
        "description": description,
        "module": "Heva Intranet"
    })
    doc.insert(ignore_permissions=True)
