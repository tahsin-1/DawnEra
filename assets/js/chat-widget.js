/* Dawn Era — AI assistant widget.
   Extracted unchanged from the four pages (it was byte-identical on all of
   them) into one shared file so it only has to be maintained once. */
(function () {
  var KB = [
    { k: ['drop','launch','when','release'], r: "Drop 01 is currently in the works — hoodie, tee, and cap to start. Join the early-access list on our <a href='contact.html'>Contact page</a> to be first to know the exact date!" },
    { k: ['order','buy','purchase','checkout'], r: "Browse the <a href='shop.html'>Shop page</a>, pick a size, add to cart, then hit checkout — it opens WhatsApp with your order details pre-filled, ready to send." },
    { k: ['size','sizing','fit','measurement'], r: "Each piece has a size selector (S–XL) right on the product card. For exact measurements once Drop 01 ships, just ask to be connected to the team." },
    { k: ['ship','delivery','deliver','dhaka'], r: "We're based in Dhaka. Delivery areas and timelines will be shared closer to launch — I can connect you to the team for specifics." },
    { k: ['price','cost','koto','taka','how much'], r: "Pricing for Drop 01 will be announced at launch. Join the early-access list on our <a href='contact.html'>Contact page</a> so you don't miss it." },
    { k: ['human','whatsapp','real person','agent','talk'], r: "Of course — <a href='https://wa.me/8801997307069?text=Hi%20Dawn%20Era!' target='_blank' rel='noopener'>tap here to chat with us directly on WhatsApp</a>." },
    { k: ['story','about','brand','dawn era'], r: "Dawn Era is streetwear for the hour between night and morning — read the full story <a href='story.html'>here</a>." }
  ];
  var FALLBACK = "I'm still learning that one! For anything specific, <a href='https://wa.me/8801997307069?text=Hi%20Dawn%20Era!' target='_blank' rel='noopener'>our team's happy to help directly on WhatsApp</a>.";
  var QUICK_INITIAL = ["When's Drop 01?", "How do I order?", "Sizing help", "Talk to a human"];

  var btn = document.getElementById('aiChatBtn');
  var win = document.getElementById('aiChatWindow');
  var body = document.getElementById('aiChatBody');
  var quickWrap = document.getElementById('aiChatQuick');
  var form = document.getElementById('aiChatForm');
  var input = document.getElementById('aiChatInput');
  var closeBtn = document.getElementById('aiChatClose');
  var started = false;

  function addMsg(text, who) {
    var d = document.createElement('div');
    d.className = 'ai-msg ai-msg--' + who;
    d.innerHTML = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  function setQuick(list) {
    quickWrap.innerHTML = '';
    list.forEach(function (q) {
      var b = document.createElement('button');
      b.className = 'ai-chip';
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function () { handleUserMessage(q); });
      quickWrap.appendChild(b);
    });
  }
  function respond(userText) {
    var typing = document.createElement('div');
    typing.className = 'ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    var lower = userText.toLowerCase();
    var match = KB.find(function (item) { return item.k.some(function (kw) { return lower.indexOf(kw) > -1; }); });
    setTimeout(function () {
      typing.remove();
      addMsg(match ? match.r : FALLBACK, 'bot');
      setQuick(QUICK_INITIAL);
    }, 650 + Math.random() * 450);
  }
  function handleUserMessage(text) {
    if (!text.trim()) return;
    addMsg(text.replace(/</g, '&lt;'), 'user');
    quickWrap.innerHTML = '';
    respond(text);
  }

  btn.addEventListener('click', function () {
    var isOpen = win.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', isOpen);
    if (isOpen && !started) {
      started = true;
      setTimeout(function () {
        addMsg("Hi! I'm the Dawn Era Assistant. Ask me about Drop 01, sizing, shipping, or how to order.", 'bot');
        setQuick(QUICK_INITIAL);
      }, 350);
    }
    if (isOpen) input.focus();
  });
  closeBtn.addEventListener('click', function () { win.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value; input.value = '';
    handleUserMessage(v);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { win.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
})();
