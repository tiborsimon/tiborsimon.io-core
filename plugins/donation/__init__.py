from pelican import signals
from pelican.generators import ArticlesGenerator, PagesGenerator
from bs4 import BeautifulSoup
import os


BUTTON_TEMPLATE = '''
<!-- Button trigger modal -->
<div class="well">
<p class="text-center lead">{}</p>
<button type="button" class="btn btn-primary btn-block btn-lg" data-toggle="modal" data-target="#donation-modal">Donate</button>
</div>
'''

MODAL_TEMPLATE = '''
<!-- Modal -->
<div class="modal fade" id="donation-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog modal-sm" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i class="fa fa-times"></i></span></button>
        <h4 class="modal-title" id="myModalLabel">Donation</h4>
      </div>
      <div class="modal-body">
        <div style="text-align: center; font-size: 700%"><i class="fa fa-heart-o"></i></div>
        <p>Thank you very much that you have decided to support my work with a small amount of donation!</p>
        <div class="row">
          <div class="col-xs-12 text-center">
            <a class="FlattrButton" style="display:none;"
                title="Tibor's work on tiborsimon.io"
                data-flattr-uid="tiborsimon"
                data-flattr-tags="engineering, embedded, web, python, c, ios, applications, development, music, hardware, networks, opensource"
                data-flattr-category="software"
                data-flattr-popout="1"
                href="http://tiborsimon.io">
            </a>
          </div>
          <div class="col-xs-12 text-center" style="margin-top: 6px">
            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
            <input type="hidden" name="cmd" value="_s-xclick">
            <input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----
            ">
            <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
            <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
            </form>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default btn-xs" data-dismiss="modal">I changed my mind..</button>
      </div>
    </div>
  </div>
</div>
'''

def render_donation(pelican):
    print('Rendering donations..')
    for dirpath, _, filenames in os.walk(pelican.settings['OUTPUT_PATH']):
        for name in filenames:
            if name.endswith('html'):
                filepath = os.path.join(dirpath, name)
                soup = BeautifulSoup(open(filepath), 'html.parser')
                for m in soup.find_all('div', class_='modals'):
                    modal_div = m
                for donation_div in soup.find_all('div', class_='donation'):
                    text = donation_div.string
                    donation_div.string = BUTTON_TEMPLATE.format(text)
                    modal_div.append(MODAL_TEMPLATE)
                    with open(filepath, 'w') as f:
                        f.write(soup.prettify(formatter=None))


def register():
    signals.finalized.connect(render_donation)


