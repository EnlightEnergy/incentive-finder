#!/usr/bin/env python3
"""
Consolidate California utility ZIP codes: PG&E, SCE, SDG&E, LADWP (commercial-eligible), and MCE (CCA).
(See README for details and citations.)
"""

import io, re, sys, time, typing as t
from pathlib import Path
import requests, pandas as pd, pdfplumber

OUTDIR = Path("utility_zips_out")
OUTDIR.mkdir(exist_ok=True)

ZIP_RE = re.compile(r"\\b9\\d{4}\\b")

def fetch(url: str, retries: int = 3, timeout: int = 30) -> bytes:
    for i in range(retries):
        try:
            r = requests.get(url, timeout=timeout)
            r.raise_for_status()
            return r.content
        except Exception:
            if i == retries - 1: raise
            time.sleep(1.5)
    return b""

def zips_from_pdf(pdf_bytes: bytes) -> list[str]:
    z: set[str] = set()
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            z.update(re.findall(ZIP_RE, txt))
    return sorted(z)

def save_list(path: Path, zips: list[str]):
    import pandas as pd
    pd.DataFrame({"zip": zips}).to_csv(path, index=False)

def pge():
    url = "https://www.pge.com/tariffs/assets/pdf/tariffbook/ELEC_MAPS_Service%20Area%20Map.pdf"
    return zips_from_pdf(fetch(url))

def sce():
    urls = [
        "https://liob.cpuc.ca.gov/wp-content/uploads/sites/14/2020/12/KeyTerms.pdf",
        "https://energy-solution.com/wp-content/uploads/2021/08/TECH-SCE-HPWH-ZIP-Code-List.pdf",
    ]
    z = set()
    for u in urls:
        try: z.update(zips_from_pdf(fetch(u)))
        except Exception as e: print(f"[WARN] SCE parse failed for {u}: {e}", file=sys.stderr)
    return sorted(z)

def sdge():
    url = "https://www.sdge.com/sites/default/files/documents/Utility%20Zip%20Codes%20by%20Climate%20Zones.pdf"
    return zips_from_pdf(fetch(url))

def ladwp():
    url = "https://www.ladwp.com/sites/default/files/documents/Residential_Electric_Zones_Table.pdf"
    return zips_from_pdf(fetch(url))

def mce():
    url = "https://mcecleanenergy.org/wp-content/uploads/2018/05/Zip-Codes-in-MCE-service-area-5-1-18.xlsx"
    xls = fetch(url)
    df = pd.read_excel(io.BytesIO(xls), header=None).astype(str)
    z = set()
    for val in df.stack().tolist():
        if re.fullmatch(r"9\\d{4}", val): z.add(val)
    return sorted(z)

def consolidate():
    import pandas as pd
    rows = []
    def tag(zs, owner, source, cca="none", notes=""):
        return [{"zip": z, "owner_utility": owner, "cca": cca, "notes": notes, "source": source} for z in zs]

    PGE = pge(); save_list(OUTDIR/"pge_zips.csv", PGE)
    SCE = sce(); save_list(OUTDIR/"sce_zips.csv", SCE)
    SDGE = sdge(); save_list(OUTDIR/"sdge_zips.csv", SDGE)
    LADWP = ladwp(); save_list(OUTDIR/"ladwp_zips_commercial.csv", LADWP)
    MCE = mce(); save_list(OUTDIR/"mce_zips.csv", MCE)

    rows += tag(PGE, "PGE", "PG&E Service Territory PDF (tariff)", notes="all or portions of listed ZIPs")
    rows += tag(SCE, "SCE", "CPUC SCE ZIP list + TECH SCE ZIP list", notes="partial overlaps likely")
    rows += tag(SDGE, "SDGE", "SDG&E Utility Zip Codes by Climate Zones", notes="climate zone mapping in source")
    rows += tag(LADWP, "LADWP", "LADWP Residential Electric Zone Tables", notes="territory ZIPs; treated as commercial-eligible")
    rows += tag(MCE, "PGE/SCE", "MCE ZIPs XLSX", cca="MCE", notes="CCA on IOU wires; overlaps")

    df = pd.DataFrame(rows).drop_duplicates(subset=["zip","owner_utility","cca"]).sort_values(["zip","owner_utility","cca"])
    df.to_csv(OUTDIR/"consolidated_utility_zips.csv", index=False)
    return OUTDIR

if __name__ == "__main__":
    out = consolidate()
    print(f"Done. See: {out.resolve()}")
