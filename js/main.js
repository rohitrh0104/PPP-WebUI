/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function($, window) {
	'use strict';

	var url = $.url();
	var languageCode = url.param('lang') ? url.param('lang') : 'en';
	var api = new window.pppApi(window.config.pppCoreUrl);
	var inputParser = new window.inputParser();
	var resultBuilder = new window.resultBuilder();
	var resultSpeaker = new window.resultSpeaker(languageCode);
	var speechInput = new window.speechInput(languageCode);
	var $simpleSerarchResult = $('#simplesearch-result');
	var $questionInput = $('#simplesearch-input-question');
	var currentInput = '';


	function buildUrlForQuestion(question) {
		var query = {
			'lang': languageCode,
			'q': question
		};
		return window.location.href.split('#')[0].split('?')[0]  + '?' + $.param(query);
	}

	function getRandomQuestion() {
		var questions = [
			'What is the birth date of George Washington?',
			'Who is the president of France?',
			'What is the capital of Australia?',
			'What is the birth date of the president of the United States?',
			'Who is the author of "Foundation"?',
			'Who is the director of "Pulp Fiction"?'
		];
		return questions[Math.floor(Math.random()*questions.length)];
    }

	function submitQuery(question, shouldSpeak) {
		$questionInput.val(question);
		doQuery(question, shouldSpeak);
	}

	function doQuery(question, shouldSpeak) {
		var input = inputParser.parse(question);
		currentInput = input;

		$simpleSerarchResult.empty()
			.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
			.append(
				$('<div>')
					.addClass('panel panel-default')
					.append(
						$('<div>')
							.addClass('panel-body text-center')
							.append(
								$('<span>')
									.addClass('fa fa-spinner fa-spin')
							)
							.append(' Loading...')
					)
			);

		var measures = {
			'relevance': 0,
			'accuracy': 1
		};
		api.sendRequest(
			{
				'language': languageCode,
				'id': (new Date()).getTime() + '-' + 'webui',
				'tree': input,
				'measures': measures,
				'trace': [
					{
						'module': 'input',
						'tree': input,
						'measures': measures
					}
				]
			},
			function(results) {
				if(input != currentInput) {
					return; //old result
				}

				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
					.append(resultBuilder.outputResults(results));

				MathJax.Hub.Queue(['Typeset', MathJax.Hub]); //reload MathJax
				if(shouldSpeak || config.speaking) {
					resultSpeaker.speakResults(results);
				}
			},
			function(jqXHR, textStatus) {
				if(input != currentInput) {
					return; //old result
				}

				$('#simplesearch-result')
					.empty()
					.append(resultBuilder.outputQuery({'language':languageCode, 'tree':input}, buildUrlForQuestion(question)))
					.append(resultBuilder.outputError(textStatus));
			}
		);
	}

	function setupSimpleForm() {
		$questionInput.attr('lang', languageCode);

		var queryQuestion = url.param('q');
		if(queryQuestion) {
			submitQuery(queryQuestion, false);
		}

		$('#simplesearch-form').submit(function(event) {
			event.preventDefault();
			doQuery($questionInput.val(), false);
		});

		$('.simplesearch-button-random').click(function() {
			submitQuery(getRandomQuestion(), false);
		});

		speechInput.setupSpeechInput(function(result) {
			submitQuery(result, true);
		});
	}

	$(function() {
		setupSimpleForm();
	});
} (jQuery, window));
