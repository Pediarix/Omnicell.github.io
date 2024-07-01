let currentQuestionIndex = 0;
let responses = [];
let surveyQuestions = [];
let surveyTitle = "Survey";
let totalQuestions = 0;

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadSurvey() {
    const surveyName = getQueryParam('name');
    if (!surveyName) {
        alert('Survey name is missing in the URL parameters.');
        return;
    }

    try {
        const response = await fetch(`survey_${surveyName}.txt`);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());

        let title = "";
        lines.forEach(line => {
            if (!line.includes('|')) {
                title = line;
            } else {
                const parts = line.split('|');
                surveyQuestions.push({
                    question: parts[0],
                    options: parts.slice(1).map(option => {
                        const [text, score] = option.split('/');
                        return { text, score: parseInt(score, 10) };
                    }),
                    isSubjective: parts[0].startsWith('*'),
                    title: title || "Survey"
                });
                if (parts.length !== 2) {
                    totalQuestions++;
                }
            }
        });

        displayQuestion();
    } catch (error) {
        console.error('Error loading survey:', error);
    }
}

function displayQuestion() {
    const form = document.getElementById('dynamicQuestions');
    form.innerHTML = ''; // Clear previous question

    if (currentQuestionIndex >= surveyQuestions.length) {
        document.getElementById('nextButton').style.display = 'none';
        document.getElementById('completeButton').style.display = 'block';
        return;
    }

    const questionData = surveyQuestions[currentQuestionIndex];
    document.getElementById('surveyTitle').textContent = questionData.title;

    const div = document.createElement('div');
    div.classList.add('question', 'mb-4');

    const label = document.createElement('label');
    label.textContent = `${questionData.question} (${currentQuestionIndex + 1} of ${totalQuestions})`;
    div.appendChild(label);
    div.appendChild(document.createElement('br'));

    if (questionData.isSubjective) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = 'subjectiveInput';
        div.appendChild(input);
    } else {
        questionData.options.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-secondary btn-block mb-2';
            button.textContent = option.text;
            button.onclick = () => handleOptionClick(option.score);
            div.appendChild(button);
        });
    }

    form.appendChild(div);

    if (currentQuestionIndex > 0) {
        document.getElementById('backButton').style.display = 'block';
    } else {
        document.getElementById('backButton').style.display = 'none';
    }
}

function handleOptionClick(score) {
    responses[currentQuestionIndex] = score;
    currentQuestionIndex++;
    displayQuestion();
}

function goBack() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function calculateScore() {
    const score = responses.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = '';

    surveyQuestions.forEach((questionData, index) => {
        const response = responses[index];
        const responseText = questionData.isSubjective ? response : questionData.options.find(option => option.score === response)?.text;
        const div = document.createElement('div');
        div.textContent = `${questionData.question}: ${responseText}`;
        summaryContent.appendChild(div);
    });

    const resultDiv = document.createElement('div');
    resultDiv.className = 'mt-4';
    resultDiv.innerHTML = `<strong>Your total score is: ${score}</strong>`;
    summaryContent.appendChild(resultDiv);

    document.getElementById('surveyForm').style.display = 'none';
    document.getElementById('summary').style.display = 'block';
}

window.onload = loadSurvey;
