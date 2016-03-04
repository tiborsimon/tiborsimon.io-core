from pelican import signals
from pelican.generators import ArticlesGenerator, PagesGenerator
from bs4 import BeautifulSoup
import time
import os


def process_date_requests(pelican):
    for dirpath, _, filenames in os.walk(pelican.settings['OUTPUT_PATH']):
        for name in filenames:
            if name.endswith('html'):
                filepath = os.path.join(dirpath, name)
                soup = BeautifulSoup(open(filepath), 'html.parser')
                for current_date in soup.find_all('span', class_='ts-current-date'):
                    current_date.string = time.strftime("%Y-%m-%d %H:%M")
                for current_year in soup.find_all('span', class_='ts-current-year'):
                    current_year.string = time.strftime("%Y")
                with open(filepath, 'w') as f:
                    f.write(soup.prettify())

def register():
    signals.finalized.connect(process_date_requests)
