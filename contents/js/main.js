import Rx from 'rx/dist/rx.all.min';
import $ from 'jquery/dist/jquery.min';

const $blog = $('.Blog');
const $refs = $('.Article-body a[title]');
const $header = $('.Header');
const $headerInfo = $header.find('.Header-info');

const headerTransition = $header.css('transition');

const refs = Array.prototype.slice.call($refs);

const scrolls = Rx.Observable.fromEvent(document, 'scroll')
  .map(
    (e) => $blog.scrollTop()
  )
  .distinctUntilChanged().startWith(0, 0);

const diff = scrolls.bufferWithCount(2, 1);

const smooth = diff
  .where(
    (pos) => Math.abs(pos[0] - pos[1]) < 40
  );

const coarse = diff
  .where(
    (pos) => Math.abs(pos[0] - pos[1]) >= 40
  )
  .debounce(175);

smooth.subscribe(
  () => $header.css('top', $blog.scrollTop() + 'px')
);

var timeout;

coarse.subscribe(
  (top) => {
    $header
      .css('top', $blog.scrollTop() + 'px');

    if (!timeout)
      timeout = setTimeout(() => $header.css('transition', headerTransition))
  }
);

const $headerRefs = refs.reduce(
  (a, el) => a.add($('<a/>', {
      href: el.href,
      title: el.title,
      text: el.title
    })),
    $([])
);

$headerInfo.append($headerRefs);

[$refs, $headerRefs].forEach(
  (list) => list.each(
    (i, el) => el.innerHTML += `<sup>${i}</sup>`
  )
);

const $allRefs = $refs.add($headerRefs);

$allRefs.addClass('Citation').attr('target', '_blank');

const allRefsMouseover = Rx.Observable.fromEvent($allRefs, 'mouseover');

const mouseleaves = allRefsMouseover
  .flatMap(
    Rx.Observable.fromEvent($allRefs, 'mouseleave').take(1)
  )
  .map(
    (e) => refMatch(e.target)
  );

const mouseovers = allRefsMouseover
  .distinctUntilChanged()
  .map(
    (e) => refMatch(e.target)
  );

mouseovers.subscribe(
  ($el) =>
    $el.addClass('is-active')
);

mouseleaves.subscribe(
  ($el) =>
    $el.removeClass('is-active')
);

function refMatch(el) {
  if (!el.title) {
    do {
      el = el.parentElement;
    } while (el != document.body && el.tagName != 'A');
  }

  return $(`a[title=${el.title}]`.replace(/ /g, '\\ '));
}
