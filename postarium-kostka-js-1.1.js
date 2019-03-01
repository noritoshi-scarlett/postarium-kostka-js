$(document).ready(function() {
  var textNotHere = "Ulala, ten wynik rzutu kością nie należy do tego postu O.O";
  var textNotConnection = "Wystąpiły błędy podczas łączenia T_T. Kliknij we mnie aby sprawdzić rzut na stronie Postarium Kostka!";
  var textMeybeInPrevPage = "Na poprzedniej stronie ostatnim postem powinien być następujący:";
  var textCorrectDiceRoll = "Rzut kostką został poprawnie wstawiony.";
  var textCorrectDiceRollinPosting = "Poniższy rzut kostką zostanie umieszczony w poście. Jeśli chcesz wykonac kolejny rzut, powtóz wykonaną operację i zaznacz opcję \"Dopisz do wykonanego wcześniej rzutu\" <3";
  var textIncorrectPrevPost = "Ten post powinien być, a nie jest poprzedzony następującym postem:";
  var textSnackbarCopyToStore = "Link został zapisany w pamięci przeglądarki.";
  var textSnackbarCopyToClip = "Link został skopiowany do schowka.";
  var textNotCoppiedToStorage = "Nie kliknąłeś w ikonkę z kostką na poprzedniej stronie!";
  var textSnackbarDuplicateDiceLink = "Ten link został już użyty do następującego rzutu: ";
  var textSnackbarLinkUsedForDice_1 = "W tym poscie wykonano już następujący rzut: ";
  var textSnackbarLinkUsedForDice_2 = "W tym poście wykonałeś już ten rzut, ale możesz dodać mu kolejne: ";
  var textClickForDetails = "kliknij, aby otworzyć w nowym oknie";
  var textGoToPrevSite = "Rzut w tym poście wymaga przejścia na poprzednią stronę tematu i kliknięcia w przycisk znajdujący się przy liczniku stron.";
  var textCannotRollInFirst = "Ten post jest pierwszym w tym temacie i nie jest możliwe wykonywanie w nim rzutów.";
  var forumAddress = location.hostname.split('.');
  var forumName = forumAddress.shift();
  var forum_name_in_app = "shadow-york";
  var diceTypesArray = ['2', '4', '6', '8', '10', '12', '20', '100'];
  var snackbar_timer;

  // kazdy rzut wklejony w post -> pobierz wynik i zaprezentuj
  $('a[href^="https://postarium.pl/kostka/dices/view/"]').each(function() {
    var link = $(this);
    $.ajax({
      type: "GET",
      url: link.attr('href'),
      crossDomain: !0,
      contentType: "application/json; charset=utf-8",
      data: {
        'ajax_request': !0,
        'forum_name': encodeURIComponent(forumName)
      },
      dataType: 'json',
      success: function(json) {
        if (json.status > 0) {
          checkRoll(link, json);
          link.text('');
          $(json.dices).each(function(index, dice) {
            link.append($('<div>').append(
				$('<div class="dice-title">').text(dice.dice_name),
				$('<div class="dice-desc">').text(dice.dice_desc),
				$('<div class="dice-place' + (($.inArray(dice.dice_type, diceTypesArray) === -1) ? ' dice-custom"' : '" data-number="' + dice.dice_type + '"') + ' data-count="' + dice.dice_count + '">'),
				$('<div class="dice-type">').text("(1-" + dice.dice_type + ")"),
				$('<div class="dice-values">').text(dice.dice_values)
			))
          })
        } else {
          someError(link, textNotHere)
        }
      },
      error: function() {
        someError(link, textNotConnection)
      }
    })
  });

  // sprawdz, czy wklejono rzut pod odpowiednim postem
  function checkRoll(link, json) {

	if (window.location.pathname.indexOf("posting") != -1) {
		link.parent().before($('<div class="dice-before-test">').append($('<div style="text-align: center">').text(textCorrectDiceRollinPosting)))
		return;
	}
    var postsLinksArray = $('a[href^="../postlink"]:not([href*="?"]');
    var findLinkBefore = postsLinksArray.filter(function() {
      return ($(this).prop("href") == json.roll.roll_url)
    });
    var indexLinkBefore = postsLinksArray.index(findLinkBefore);
    var find_parent = link.closest("span.postbody");
    var find_flag = !1;
    var find_maybe_frist_page = !1;
    if (find_parent.length > 0) {
      var findLinkCurrent = find_parent.parent().parent().parent().find('td:first-child > a[href^="../postlink/"]');
      var indexLinkCurrent = postsLinksArray.index(findLinkCurrent);
      find_maybe_frist_page = (indexLinkCurrent == 0);
      if (!find_maybe_frist_page && findLinkCurrent.length > 0 && (indexLinkCurrent - 1) == indexLinkBefore) {
        find_flag = !0
      }
    }
    link.wrap($('<div class="dice-cont">'));
    if (find_maybe_frist_page) {
      link.parent().before($('<div class="dice-before-test">').append($('<div>').text(textMeybeInPrevPage), $('<a href="' + json.roll.roll_url + '">').text(json.roll.roll_url + " (link)")))
    } else if (find_flag) {
      link.parent().before($('<div class="dice-before-test">').append($('<div style="text-align: center">').text(textCorrectDiceRoll)))
    } else {
      link.parent().before($('<div class="dice-before-test">').append($('<div>').text(textIncorrectPrevPost), $('<a href="' + json.roll.roll_url + '">').text(json.roll.roll_url + " (link)")))
    }
  }

  // blad w laczeniu -> kliknij i zobacz rzut bezpsrednio
  function someError(link, message) {
    link.wrap($('<div class="dice-cont">'));
    link.html($('<div class="dice-title">').text(message));
    link.children().append($('<div class="dice-place dice-error">'))
  }

  // zapisanie w local-storage linkow
  function prepareDiceID( event ) {
	localStorage.setItem("dice-link-date", $.now());
	var topic_id = (window.location.pathname.split('/')[2]).split(',')[0];
    if (topic_id != null) {
        localStorage.setItem("dice-link-topic", topic_id.replace(/[^0-9]/g, ''));
    } else {
      localStorage.setItem("dice-link-topic", "not-checked");
    }
    localStorage.setItem("dice-link-url", event.data.postLink);
  }

  // sprawdz, czy link juz uzytko i jak tak, wyswietl snackbar
  function checkDuplicate(link, checkFormal) {
	$.ajax({
		type: "GET",
		url: "https://postarium.pl/kostka/dices/check.html",
		crossDomain: !0,
		contentType: "application/json; charset=utf-8",
		data: {
		  'ajax_request': !0,
		  'dice_url': encodeURIComponent(link)
		},
		dataType: 'json',
		success: function(json) {
		  if (json.status == 0 && checkFormal) {
				showSnackbar(textSnackbarCopyToStore, true);
		  }
		  if (json.status != 0) {
			var isLinkInPost = ($('.forumline a[href^="https://postarium.pl/kostka/dices/view/"]').length > 0);
			var textForDisplay = (checkFormal ? textSnackbarDuplicateDiceLink : (isLinkInPost ? textSnackbarLinkUsedForDice_2 : textSnackbarLinkUsedForDice_1));
			showSnackbar(textForDisplay + '<a class="postlink" target="_blank" href="' + json.dice_link + '">' + textClickForDetails + '</a>', false);
		  }
		},
		error: function() {
		  if (checkFormal) {
			showSnackbar(textSnackbarCopyToStore, true);
		  }
		}
    });
  }

  // pokaz snackbar
  function showSnackbar(text, autohide) {
    $("#dice-snackbar").html(text);
    if ($("#dice-snackbar").hasClass("snackbar-show")) {
      clearTimeout(snackbar_timer);
    } else {
      $("#dice-snackbar").addClass("snackbar-show");
    }
    if (autohide) {
      snackbar_timer = setTimeout(function() {
        $("#dice-snackbar").removeClass("snackbar-show")
      }, 3500);
    }
  }

  // zamkniecie snackbara
  $(document).on("click", "#dice-snackbar", function() {
    clearTimeout(snackbar_timer);
    $(this).removeClass("snackbar-show");
  });

  // funkcje porzadkowe dla widoku tematu
  if (window.location.pathname.indexOf("topics") != -1 || window.location.pathname.indexOf("viewtopic") != -1) {

    $('table.forumline').after($('<div id="dice-snackbar" class="dice-snackbar">'));

	// budwanie odpowiednich linkow do klikania w Edytuj
	var arrayOfEditBtns = new Array();
	$('a[href^="../postlink/"]:not([href*="?"]').each(function(index) {
		var current = $(this);
		if (index > 0) {
			current.parent().next().find('a[href*="/posting.htm?mode=editpost&p="]').first().on( "click", { postLink: arrayOfEditBtns[(index - 1)] }, prepareDiceID );
		} else {
			//pierwszy post na stronie
			if ($('.pagination').length > 0) {
				if ($('.pagination > *:first-child:not(b)').length > 0) {
					current.parent().next().find('a[href*="/posting.htm?mode=editpost&p="]').first().on( "click", { postLink: textGoToPrevSite}, prepareDiceID );
				} else {
					current.parent().next().find('a[href*="/posting.htm?mode=editpost&p="]').first().on( "click", { postLink: textCannotRollInFirst}, prepareDiceID );
				}
			} else {
				current.parent().next().find('a[href*="/posting.htm?mode=editpost&p="]').first().on( "click", { postLink: textCannotRollInFirst}, prepareDiceID );
			}
		}
		arrayOfEditBtns[index] = current.prop("href");
		if( current[0] === $('a[href^="../postlink/"]:not([href*="?"]').last()[0]) {
			$('.forumline ~ table + table td:nth-child(2) > span').first().prepend(
			  $('<a href="#" class="dice-copy-link">Skopiuj link do rzutu</a>').append(
			    $('<span class="dice-hide">').text(current.prop("href"))
			  ),
			  $('<br>')
			);
		}
    });

	// dane o ostatnim poscie
	if ($('a[href^="../posting.htm?mode=reply"], input[name="preview"]').length > 0) {
	  localStorage.setItem("dice-link-last-date", $.now());
	  localStorage.setItem("dice-link-last-topic", $('a[href^="../posting.htm?mode=reply"]').last().attr("href").replace(/[^0-9]/g, ''));
	  var lastUrl = $('.dice-hide').last().text();
	  localStorage.setItem("dice-link-last-url", lastUrl);
	  $('a[href^="../posting.htm?mode=reply"]').on( "click", { postLink: lastUrl}, prepareDiceID );
	  $('input[name="preview"]').on( "click", { postLink: lastUrl}, prepareDiceID );
	}

	// klikniecie w przycisk do kopiowania ostatniego linku
	$(document).on("click", ".dice-copy-link", function(e) {
      e.preventDefault();
      localStorage.setItem("dice-link-manual-date", $.now());
	  var topic_id = (window.location.pathname.split('/')[2]).split(',')[0];
      if (topic_id != null) {
        localStorage.setItem("dice-link-manual-topic", topic_id.replace(/[^0-9]/g, ''));
      } else {
        localStorage.setItem("dice-link-manual-topic", "not-checked");
      }
      localStorage.setItem("dice-link-manual-url", $(this).find('.dice-hide').text());

	  checkDuplicate($(this).find('.dice-hide').text(), true);
    });

  }

  // WYKONYWAC TEZ DLA SZYBKIEJ ODP
  // funkcje porzadkowe dla widoku odpowiedzi
  if (window.location.pathname.indexOf("posting") != -1) {

	$("table.forumline").last().before($('<div id="dice-snackbar" class="dice-snackbar">'));

	// jesli okno ma ponad 4 wiersze, czyli to pewnie jest okienko odp
    if ($("table.forumline > tbody > tr").length > 4) {

	  var isNewTopic = ( $('input[name="mode"]').val() == "newtopic");

	  if (isNewTopic) {
		  warningInfoInPost(textCannotRollInFirst);
		  return;
	  }

	  // pobieranie danych ze storage
      var dice_date_storage = "", dice_link_storage = "", dice_topic_storage = "",
		  dice_date_last_storage = "", dice_link_last_storage = "", dice_topic_last_storage = "",
		  dice_date_manual_storage = "", dice_link_manual_storage = "", dice_topic_manual_storage = "";
	  if (localStorage.getItem("dice-link-date")) {
        dice_date_storage = localStorage.getItem("dice-link-date");
      }
      if (localStorage.getItem("dice-link-url")) {
		dice_link_storage = localStorage.getItem("dice-link-url");
      }
      if (localStorage.getItem("dice-link-topic")) {
        dice_topic_storage = localStorage.getItem("dice-link-topic");
      }
	  if (localStorage.getItem("dice-link-last-date")) {
        dice_date_last_storage = localStorage.getItem("dice-link-last-date");
      }
      if (localStorage.getItem("dice-link-last-url")) {
        dice_link_last_storage = localStorage.getItem("dice-link-last-url");
      }
      if (localStorage.getItem("dice-link-last-topic")) {
        dice_topic_last_storage = localStorage.getItem("dice-link-last-topic");
      }
	  if (localStorage.getItem("dice-link-manual-date")) {
        dice_date_manual_storage = localStorage.getItem("dice-link-manual-date");
      }
	  if (localStorage.getItem("dice-link-manual-url")) {
        dice_link_manual_storage = localStorage.getItem("dice-link-manual-url");
      }
      if (localStorage.getItem("dice-link-manual-topic")) {
        dice_topic_manual_storage = localStorage.getItem("dice-link-manual-topic");
	  }
      var isSameTopic = (dice_topic_storage == "not-checked" || ($('input[name="t"]').length > 0 && dice_topic_storage == $('input[name="t"]').val() ) );
      var isSameTopicLast = (dice_topic_last_storage == $('input[name="t"]').val() );
      var isSameTopicManual = (dice_topic_manual_storage == dice_topic_storage);
	  var isLastBetter = (dice_date_last_storage > dice_date_storage)
      var isReply = ( $('input[name="mode"]').val() == "reply");
	  var inputDiceUrl = "";
      var onlyPlaceholder = true;

	  // pierwszy post na niepierwszej stronie i skopiowano link
	  if (dice_link_storage == textGoToPrevSite && isSameTopicManual && !isReply) {
		  dice_link_storage = dice_link_manual_storage;
	  }
	  if (dice_link_storage == textGoToPrevSite) {
		  // pierwszy post na niepierwszej stronie
		  warningInfoInPost(textGoToPrevSite);
	  } else if (dice_link_storage == textCannotRollInFirst) {
		  // pierwszy post na pierwszej stronie
		  warningInfoInPost(textCannotRollInFirst);
	  } else {
		  // nowy post
		  if (isReply && isSameTopicLast && dice_link_last_storage != "") {
			inputDiceUrl = dice_link_last_storage;
			onlyPlaceholder = false;
		  }
		  // edycja postu
		  if (!isReply && dice_link_storage != "" ) {
			inputDiceUrl = dice_link_storage;
			onlyPlaceholder = false;
		  }
		  if (onlyPlaceholder) {
			inputDiceUrl = textNotCoppiedToStorage;
		  }

		  // dodanie pola z linkiem i ramki
		  $("form > table.forumline > tbody > tr:last-child").last().before($('<tr>').append(
			$('<td class="row1">').append($('<span class="gen">').append($('<b>').text("Rzut kostką:"))),
			$('<td class="row2">').append($('<span class="genmed">').append(
			  $('<label>').html("Link do rzutu kostką: <em>(kliknij, aby skopiować do schowka)</em>"),
			  $('<input id="dice-link-clipboard" class="liteoption" type="text" name="dice-link-clipboard"' + (onlyPlaceholder ?  'placeholder="' + inputDiceUrl + '" value="" ' : 'value="' + inputDiceUrl + '"') + '>'),
			  $('<input id="show-roll-cont" class="liteoption" type="button" name="show-roll-cont" value="Pokaż ramkę ze stroną do rzutów kostką">')
			))
		  ));

		  // sprawdzaj czy mozna tutaj rzucac, o ile masz jakiś link skopiowany przez automat
		  if (inputDiceUrl != "") {
			checkDuplicate(inputDiceUrl, false);
		  }

		  // kopiowanie do schowka
		  $(document).on('click', '#dice-link-clipboard', function() {
			if ( $(this).val() != "" && ($(this).val() == dice_link_storage || $(this).val() == dice_link_last_storage)) {
			  $(this).select();
			  document.execCommand("copy");
			  showSnackbar(textSnackbarCopyToClip, true);
			}
		  });
		  // otwieranie ramki
		  $(document).on('click', '#show-roll-cont', function() {
			$(this).parent().parent().parent().after($('<tr>').append($('<td colspan="2">').append($('<iframe src="https://postarium.pl/kostka/forum/diceroll/' + forum_name_in_app + '.html" width="100%" height="550" frameborder="0">'))));
			$(this).hide()
		  })
	  }
    }
  }

  function warningInfoInPost(text) {
	    $("form > table.forumline > tbody > tr:last-child").last().before($('<tr>').append(
			$('<td class="row1">').append($('<span class="gen">').append($('<b>').text("Informacja o rzucie kostką:"))),
			$('<td class="row2">').append($('<span class="genmed">').append(
			  $('<input id="dice-warning" class="liteoption" type="button" name="dice-warning" value="Czemu nie moge rzucać?">')
			))
		));

		// otwieranie ramki
		$(document).on('click', '#dice-warning', function() {
			showSnackbar(text, false);
		})

  }

});
