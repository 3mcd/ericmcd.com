import Rx from 'rx/dist/rx.all.min';
import $ from 'jquery/dist/jquery.min';

const $blog = $('.Blog');
const $refs = $('.Article-body a[title]');
const $header = $('.Header');
const $refContainer = $header.find('.References');

const headerTransition = $header.css('transition');

const refs = Array.prototype.slice.call($refs);

const $headerRefs = refs.reduce(
  (a, el) => a.add($('<a/>', {
      href: el.href,
      title: el.title,
      text: el.title
    })),
    $([])
);

$refContainer.append($headerRefs);

[$refs, $headerRefs].forEach(
  (list) => list.each(
    (i, el) => el.innerHTML += `<sup>${i}</sup>`
  )
);

const $allRefs = $refs.add($headerRefs);

$allRefs.addClass('Citation').attr('target', '_blank');

$refContainer.addClass('is-active');

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