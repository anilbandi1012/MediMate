import re

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_medicine_and_dosage(text: str):
    pattern = r'([a-z]+)\s*(\d+\s?(mg|ml))'
    match = re.search(pattern, text)

    if match:
        return match.group(1).title(), match.group(2)

    return None, None

def extract_frequency(text: str):
    if "once" in text:
        return 1
    if "twice" in text:
        return 2
    if "thrice" in text:
        return 3
    return None


def extract_times(text: str):
    times = []
    if "morning" in text:
        times.append("morning")
    if "afternoon" in text:
        times.append("afternoon")
    if "night" in text or "evening" in text:
        times.append("night")
    return times

def extract_duration(text: str):
    match = re.search(r'(\d+)\s*day', text)
    return int(match.group(1)) if match else None

def parse_medicine_data(raw_text: str):
    text = normalize_text(raw_text)

    name, dosage = extract_medicine_and_dosage(text)

    return {
        "medicine_name": name,
        "dosage": dosage,
        "frequency_per_day": extract_frequency(text),
        "times": extract_times(text),
        "duration_days": extract_duration(text)
    }
