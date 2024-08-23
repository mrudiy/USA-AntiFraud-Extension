// ==UserScript==
// @name         USA Anti Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  USA Anti Fraud Extension
// @author       Maxim Rudiy
// @match        https://admin.funrize.com/*
// @match        https://admin.nolimitcoins.com/*
// @match        https://admin.taofortune.com/*
// @match        https://admin.funzcity.com/*
// @match        https://admin.fortunewheelz.com/*
// @updateURL 	 https://github.com/mrudiy/USA-AntiFraud-Extension/raw/main/USA%20Anti%20Fraud%20Extension.user.js
// @downloadURL  https://github.com/mrudiy/USA-AntiFraud-Extension/raw/main/USA%20Anti%20Fraud%20Extension.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const initialsKey = 'userInitials';
    const languageKey = 'language';


    function createPopupBox() {
        let popupBox = document.getElementById('custom-popup-box');
        if (popupBox) {
            return;
        }
        const button = document.querySelector('#show-player-in-out');
        if (button) {
            button.click();

            setTimeout(function() {
                const popup = document.querySelector('#swal2-content');
                if (popup) {
                    const totalCell = popup.querySelector('table tbody tr:nth-child(2) td:nth-child(2)');
                    const monthCell = popup.querySelector('table tbody tr:nth-child(2) td:nth-child(1)');
                    if (totalCell && monthCell) {
                        const TotalPA = totalCell.textContent.trim();
                        const MonthPA = monthCell.textContent.trim();
                        const closeButton = document.querySelector('button.swal2-confirm');
                        if (closeButton) {
                            closeButton.click();
                        }
                        const entries = document.querySelector('#Players_balance').value.trim();
                        const winnings = getWinnings();

                        analyzePayments(function(offerPercentage, totalMoneyFromOffer, totalDeposits, moneyFromOfferPercentage, totalDepositsAmount, depositsWithOffer) {
                            const offerInfoElement = document.getElementById('offer-info');

                            if (offerInfoElement) {
                                const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;

                                const offerPercentageText = colorText(`Deposits With Offer: ${offerPercentage}%`, offerPercentage >= 50);
                                const moneyFromOfferPercentageText = colorText(`Money From Offer: ${moneyFromOfferPercentage}%`, moneyFromOfferPercentage >= 25);

                                offerInfoElement.innerHTML = `${offerPercentageText}<br>${moneyFromOfferPercentageText}`;
                                offerInfoElement.title = `Кількість депозитів: ${totalDeposits}\nКількість оферів: ${depositsWithOffer}\nСума депозитів: ${totalDepositsAmount}$\nСума entries: ${totalMoneyFromOffer}$`;
                            }
                            analyzeTransaction(function(totalUSD) {
                                const activityMoneyInfoElement = document.getElementById('activitymoney-info');
                                const activityMoneyPercentage = totalDepositsAmount > 0 ? (totalUSD / totalDepositsAmount) * 100 : 0;

                                if (activityMoneyInfoElement) {
                                    const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;
                                    const activityMoneyPercentageText = colorText(`Activity Money: ${activityMoneyPercentage.toFixed(2)}%`, activityMoneyPercentage >= 50);

                                    activityMoneyInfoElement.innerHTML = `${activityMoneyPercentageText}`;
                                    activityMoneyInfoElement.title = `Activity Money: ${totalUSD}$`;

                                    const freeMoneyInfoElement = document.getElementById('freemoney-info');
                                    let freeMoneyTotal = activityMoneyPercentage + parseFloat(moneyFromOfferPercentage)
                                    let textColor;
                                    if (freeMoneyTotal < 10) {
                                        textColor = 'green';
                                    } else if (freeMoneyTotal >= 10 && freeMoneyTotal < 50) {
                                        textColor = 'orange';
                                    } else {
                                        textColor = 'red';
                                    }
                                    freeMoneyInfoElement.innerHTML = `Free Money: ${freeMoneyTotal.toFixed(2)}%`;
                                    freeMoneyInfoElement.style.color = textColor;
                                    popupBox.style.borderColor = textColor;
                                    popupBox.style.animation = `glow 1s infinite alternate`;

                                    const style = document.createElement('style');
                                    style.textContent = `
                                    @keyframes glow {
                                        0% { box-shadow: 0 0 5px ${textColor}; }
                                        100% { box-shadow: 0 0 25px ${textColor}; }
                                    }
                                `;
                                    document.head.appendChild(style);
                                    addCheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage)

                                }
                            });
                        });



                        getPendings(function(totalPending) {
                            const pendingInfoElement = document.getElementById('pending-info');
                            if (totalPending === 0) {
                                pendingInfoElement.remove();
                            } else {
                                pendingInfoElement.textContent = `Total Pending: ${totalPending}$`;
                            }
                            let isProfitButtonClicked = false;

                            const profitButton = document.createElement('button');
                            profitButton.innerText = 'Total InOut';
                            profitButton.style.padding = '5px 10px';
                            profitButton.style.backgroundColor = '#2196F3';
                            profitButton.style.color = 'white';
                            profitButton.style.border = 'none';
                            profitButton.style.borderRadius = '5px';
                            profitButton.style.cursor = 'pointer';
                            profitButton.addEventListener('click', () => {
                                if (!isProfitButtonClicked) {
                                    isProfitButtonClicked = true;
                                    fetchProfit(totalPending, winnings);
                                }
                            });
                            firstRowButtonContainer.appendChild(profitButton);

                        })

                        popupBox = document.createElement('div');
                        popupBox.id = 'custom-popup-box';
                        popupBox.style.position = 'fixed';
                        popupBox.style.top = '10px';
                        popupBox.style.right = '10px';
                        popupBox.style.padding = '10px';
                        popupBox.style.backgroundColor = 'white';
                        popupBox.style.border = '2px solid black';
                        popupBox.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
                        popupBox.style.zIndex = '10000';
                        popupBox.style.fontFamily = 'Arial, sans-serif';
                        popupBox.style.fontSize = '16px';
                        popupBox.style.display = 'flex';
                        popupBox.style.flexDirection = 'column';
                        popupBox.style.alignItems = 'center';
                        popupBox.style.borderRadius = '10px';

                        const settingsIcon = document.createElement('div');
                        settingsIcon.innerHTML = '&#9881;';
                        settingsIcon.style.position = 'absolute';
                        settingsIcon.style.top = '5px';
                        settingsIcon.style.right = '5px';
                        settingsIcon.style.cursor = 'pointer';
                        settingsIcon.style.fontSize = '18px';
                        settingsIcon.title = 'Settings';
                        settingsIcon.onclick = () => {
                            createSettingsPopup();
                        };
                        popupBox.appendChild(settingsIcon);


                        const maintext = document.createElement('div');
                        maintext.className = 'popup-main-text';
                        maintext.innerHTML = `
                        <center><h3 id="freemoney-info"></center>
                        <center><b>Entries: ${entries}$ | Winnings: ${winnings}$</center>
                        <center>Month: <span style="color: ${MonthPA > 1 ? 'red' : 'black'}">${MonthPA}</span> | Total: <span style="color: ${TotalPA > 1 ? 'red' : 'black'}">${TotalPA}</span></center>
                        <center id="pending-info"></center>
                        <center id="offer-info">Loading deposit analysis...</center>
                        <center id="activitymoney-info"></center>

                    `;
                        popupBox.appendChild(maintext);

                        const firstRowButtonContainer = document.createElement('div');
                        firstRowButtonContainer.style.marginTop = '10px';
                        firstRowButtonContainer.style.display = 'flex';
                        firstRowButtonContainer.style.gap = '10px';

                        popupBox.appendChild(firstRowButtonContainer);

                        const secondRowButtonContainer = document.createElement('div');
                        secondRowButtonContainer.style.marginTop = '10px';
                        secondRowButtonContainer.style.display = 'block';
                        secondRowButtonContainer.style.justifyContent = 'center';
                        secondRowButtonContainer.style.alignItems = 'center';
                        secondRowButtonContainer.style.textAlign = 'center';

                        popupBox.appendChild(secondRowButtonContainer);


                        document.body.appendChild(popupBox);

                        function fetchProfit(totalPending, winnings) {
                            const loader = document.createElement('div');
                            loader.style.border = '8px solid #f3f3f3';
                            loader.style.borderTop = '8px solid #3498db';
                            loader.style.borderRadius = '50%';
                            loader.style.width = '50px';
                            loader.style.height = '50px';
                            loader.style.animation = 'spin 2s linear infinite';
                            loader.style.marginBottom = '10px';
                            secondRowButtonContainer.appendChild(loader);

                            const style = document.createElement('style');
                            style.textContent = `
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                #popup-container {
                                    min-height: 200px;
                                    overflow-y: auto;
                                    white-space: normal;
                                    word-wrap: break-word;
                                }
                            `;
                            document.head.appendChild(style);

                            const playerID = getPlayerID();
                            const project = getProject();
                            const baseURL = `https://admin.${project}.com/players/playersDetail/index/`;

                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: baseURL,
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                data: `PlayersDetailForm%5Blogin%5D=${encodeURIComponent(playerID)}&PlayersDetailForm%5Bperiod%5D=2015.06.09+00%3A00%3A00+-+2025.05.23+23%3A59%3A59&PlayersDetailForm%5Bshow_table%5D=1`,
                                onload: function(response) {
                                    if (response.status >= 200 && response.status < 300) {
                                        console.log('HTML-ответ:', response.responseText);

                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(response.responseText, 'text/html');

                                        const table = doc.querySelector('.detail-view');
                                        let depositsTotal = 0;
                                        let redeemsTotal = 0;

                                        if (table) {
                                            const rows = table.querySelectorAll('tr');

                                            rows.forEach(row => {
                                                const key = row.querySelector('th')?.textContent.trim();
                                                const value = row.querySelector('td')?.textContent.trim();

                                                if (key === 'Deposits Total') {
                                                    depositsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                                } else if (key === 'Redeems Total') {
                                                    redeemsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                                }
                                            });

                                            let cleanBalance = parseFloat(winnings);

                                            const profit = depositsTotal - redeemsTotal;
                                            const PrognoseInOut = depositsTotal - (totalPending + redeemsTotal + cleanBalance);
                                            const PrognosePA = ((redeemsTotal + totalPending + cleanBalance) / depositsTotal) * 100;

                                            secondRowButtonContainer.removeChild(loader);
                                            secondRowButtonContainer.innerHTML += `
                                                <div><b>Total InOut: ${profit.toFixed(2)}$</b></div>
                                                ${(totalPending > 1 || cleanBalance > 1) ? `
                                                    <div><b>Prognose InOut: ${PrognoseInOut.toFixed(2)}$</b></div>
                                                    <div><b>Prognose PA: ${PrognosePA.toFixed(2)}%</b></div>
                                                ` : ''}
                                            `;
                                        } else {
                                            secondRowButtonContainer.removeChild(loader);
                                            secondRowButtonContainer.innerHTML += 'Таблица с результатами не найдена.';
                                        }
                                    } else {
                                        console.error('Ошибка ответа:', response.statusText);
                                        document.body.removeChild(loader);
                                        secondRowButtonContainer.innerHTML += `Ошибка получения данных: ${response.statusText}`;
                                    }
                                },
                                onerror: function(error) {
                                    console.error('Ошибка запроса:', error);
                                    document.body.removeChild(loader);
                                    secondRowButtonContainer.innerHTML += 'Ошибка запроса: ' + error.message;
                                }
                            });
                        }
                        ;
                    }
                }
            }, 300);
        }
    }

    function createSettingsPopup() {
        const settingsPopup = document.createElement('div');
        settingsPopup.style.position = 'fixed';
        settingsPopup.style.top = '10px';
        settingsPopup.style.right = '10px';
        settingsPopup.style.padding = '10px';
        settingsPopup.style.backgroundColor = 'white';
        settingsPopup.style.border = '1px solid black';
        settingsPopup.style.boxShadow = '0px 0px 5px rgba(0, 0, 0, 0.3)';
        settingsPopup.style.zIndex = '10001';
        settingsPopup.style.fontFamily = 'Arial, sans-serif';
        settingsPopup.style.fontSize = '14px';
        settingsPopup.style.borderRadius = '5px';

        const header = document.createElement('h2');
        header.innerText = 'Налаштування';
        header.style.fontSize = '16px';
        settingsPopup.appendChild(header);

        const initialsDisplay = document.createElement('p');
        const userInitials = GM_getValue(initialsKey, '');
        initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
        settingsPopup.appendChild(initialsDisplay);

        const languageDisplay = document.createElement('p');
        let currentLanguage = GM_getValue(languageKey, 'російська');
        languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
        settingsPopup.appendChild(languageDisplay);

        const initialsButton = document.createElement('button');
        initialsButton.innerText = 'Вказати ініціали';
        initialsButton.style.padding = '8px 16px';
        initialsButton.style.backgroundColor = '#4CAF50';
        initialsButton.style.color = 'white';
        initialsButton.style.border = 'none';
        initialsButton.style.borderRadius = '4px';
        initialsButton.style.cursor = 'pointer';
        initialsButton.addEventListener('click', () => {
            const userInitials = prompt('Введіть свої ініціали (наприклад, РМ):', GM_getValue(initialsKey, ''));
            if (userInitials !== null) {
                GM_setValue(initialsKey, userInitials);
                initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
            }
        });
        settingsPopup.appendChild(initialsButton);

        const languageButton = document.createElement('button');
        languageButton.innerText = `Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`;
        languageButton.style.padding = '8px 16px';
        languageButton.style.backgroundColor = '#2196F3';
        languageButton.style.color = 'white';
        languageButton.style.border = 'none';
        languageButton.style.borderRadius = '4px';
        languageButton.style.cursor = 'pointer';
        languageButton.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'російська' ? 'українська' : 'російська';
            GM_setValue(languageKey, currentLanguage);
            languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
            languageButton.innerText = `Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`;
        });
        settingsPopup.appendChild(languageButton);

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Закрити';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(settingsPopup);
        });
        settingsPopup.appendChild(closeButton);

        document.body.appendChild(settingsPopup);
    }

    function analyzePayments(callback) {
        const playerID = getPlayerID();
        console.log('Player ID:', playerID);

        const project = getProject();
        console.log('Project:', project);

        if (!project) {
            console.error('Project not found!');
            return;
        }

        const requestUrl = `https://admin.${project}.com/payments/paymentsItemsIn/index/?PaymentsItemsInForm%5Bsearch_login%5D=${playerID}`;
        console.log('Request URL:', requestUrl);

        GM_xmlhttpRequest({
            method: 'GET',
            url: requestUrl,
            onload: function(response) {
                console.log('Initial GET request response received.');
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                const formData = new FormData();
                formData.append('newPageSize', '1000');
                console.log('Form data for POST request:', new URLSearchParams(formData).toString());

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: requestUrl,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: new URLSearchParams(formData).toString(),
                    onload: function(response) {
                        console.log('POST request response received.');
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const rows = doc.querySelectorAll('tr.odd, tr.even');
                        console.log('Number of rows found:', rows.length);

                        let totalDeposits = 0;
                        let totalDepositsAmount = 0;
                        let totalMoneyFromOffer = 0;
                        let depositsWithOffer = 0;
                        let moneyFromOfferPercentage = 0;

                        rows.forEach((row, index) => {
                            console.log(`Processing row ${index + 1}:`, row.innerHTML);

                            const status = row.querySelector('td:nth-child(3) span.label')?.textContent.trim().toLowerCase() || '';
                            const depositAmountText = row.querySelector('td:nth-child(5) code')?.textContent.trim() || '0 USD';
                            const offerDetailsText = row.querySelector('td:nth-child(7)')?.textContent.trim() || '';

                            console.log('Status:', status);
                            console.log('Deposit Amount Text:', depositAmountText);
                            console.log('Offer Details Text:', offerDetailsText);

                            if (status === 'closed') {
                                totalDeposits++;
                                console.log('Deposit closed. Counting deposit...');

                                const depositAmountMatch = depositAmountText.match(/([\d.]+) USD/);
                                const depositAmount = depositAmountMatch ? parseFloat(depositAmountMatch[1]) : 0;
                                console.log('Deposit Amount:', depositAmount);

                                const entriesMatch = offerDetailsText.match(/(\d+\.?\d*) entries/);
                                const entriesCount = entriesMatch ? parseFloat(entriesMatch[1]) : 0;
                                console.log('Entries Count:', entriesCount);

                                if (entriesCount > 0) {
                                    depositsWithOffer++;
                                    const moneyFromOffer = entriesCount - depositAmount;
                                    console.log('Money from Offer:', moneyFromOffer);

                                    totalDepositsAmount += depositAmount;
                                    totalMoneyFromOffer += moneyFromOffer;
                                    if (totalDepositsAmount > 0) {
                                        moneyFromOfferPercentage = (totalMoneyFromOffer / totalDepositsAmount) * 100;
                                        console.log('Money from Offer Percentage:', moneyFromOfferPercentage.toFixed(2));
                                    }
                                }
                            }
                        });

                        if (totalDeposits > 0) {
                            const offerPercentage = (depositsWithOffer / totalDeposits) * 100;
                            console.log('Offer Percentage:', offerPercentage.toFixed(2));
                            console.log('Total Money from Offer:', totalMoneyFromOffer.toFixed(2));
                            console.log('Total Deposits:', totalDeposits);
                            console.log('Money from Offer Percentage:', moneyFromOfferPercentage.toFixed(2));
                            console.log('Total Deposits Amount:', totalDepositsAmount.toFixed(2));
                            console.log('Deposits with Offer:', depositsWithOffer);

                            callback(
                                offerPercentage.toFixed(2),
                                totalMoneyFromOffer.toFixed(2),
                                totalDeposits,
                                moneyFromOfferPercentage.toFixed(2),
                                totalDepositsAmount.toFixed(2),
                                depositsWithOffer
                            );
                        } else {
                            console.log('No deposits found.');
                            callback(0, 0, 0);
                        }
                    },
                });
            }
        });
    }

    function analyzeTransaction(callback) {
        const userId = window.location.pathname.split('/')[4];
        const project = getProject();

        const requestUrl = `https://admin.${project}.com/players/playersItems/transactionLog/${userId}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: requestUrl,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const formData = new FormData();
                formData.append('pageSize', '10000');

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: requestUrl,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: new URLSearchParams(formData).toString(),
                    onload: function(response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const rows = doc.querySelectorAll('tbody tr');

                        let totalUSD = 0;

                        rows.forEach((row) => {
                            const secondCell = row.querySelector('td:nth-child(2)');
                            const amountCell = row.querySelector('td:nth-child(3)');
                            const commentCell = row.querySelector('td:nth-child(8)');
                            const secondCellText = secondCell.textContent.trim().toLowerCase();

                            if (secondCell) {
                                if (secondCellText.includes("entries")) {
                                    const entryAmount = parseFloat(amountCell.textContent.trim());
                                    totalUSD += entryAmount;
                                }
                            }

                            if (commentCell) {
                                const commentText = commentCell.textContent.trim();

                                if (commentText) {
                                    const usdMatch = commentText.match(/(\d+(\.\d+)?)\s*USD/);
                                    if (usdMatch) {
                                        const amount = parseFloat(usdMatch[1]);
                                        totalUSD += amount;
                                    }
                                    if (commentText.toLowerCase().includes("entries") && !secondCellText.includes("entries")) {
                                        const entryAmount = parseFloat(amountCell.textContent.trim());
                                        totalUSD += entryAmount;
                                    }
                                }
                            }
                        });
                        if (callback) {
                            callback(totalUSD.toFixed(2));
                        }
                    }
                });
            }
        });
    }

    function getPendings(callback) {
        const playerID = getPlayerID();
        const project = getProject();
        const baseURL = `https://admin.${project}.com/payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${playerID}`;

        let totalPending = 0;

        GM_xmlhttpRequest({
            method: 'GET',
            url: baseURL,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                const select = doc.querySelector('#newPageSize');
                if (select) {
                    select.value = '500';
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
                const rows = doc.querySelectorAll('tr');
                rows.forEach(row => {
                    const statusSpan = row.querySelector('span.label');
                    if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                        const amountCode = row.querySelector('td:nth-child(5) code');
                        if (amountCode) {
                            const amountText = amountCode.textContent.trim().replace('USD', '').trim();
                            const amount = parseFloat(amountText.replace(',', '.'));
                            if (!isNaN(amount)) {
                                totalPending += amount;
                            }
                        }
                    }
                });
                callback(totalPending);
            }
        });
    }

    function insertTextIntoField(text) {
        const field = document.querySelector('#gateway-method-description-visible-antifraud_manager');
        if (field) {
            field.focus();
            field.innerHTML = text + '<br>' + field.innerHTML;

            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
        }
    }

    function addCheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');

        if (formatableTextDiv) {
            const existingButton = document.getElementById('check-button');
            if (existingButton) {
                existingButton.remove();
            }

            const checkButton = document.createElement('button');
            checkButton.id = 'check-button';
            checkButton.type = 'button';
            checkButton.innerText = 'Check';
            checkButton.onclick = () => {
                const date = getCurrentDate();
                const initials = GM_getValue(initialsKey);
                const currentLanguage = GM_getValue(languageKey, 'російська');
                const colorPA = TotalPA > 1 ? 'red' : 'black';
                console.log(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage)
                let textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span> | Freemoney From Offer: ${moneyFromOfferPercentage}% | Freemoney From Activities: ${activityMoneyPercentage.toFixed(2)}%</b> `;

                insertTextIntoField(textToInsert);
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
        }
    }

    function getWinnings() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Winnings')) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }

        return '0.00';
    }

    function getPlayerID() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Player number') || row.textContent.includes('Номер игрока')) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }
        return '0.00';
    }

    function getProject() {
        const url = window.location.href;
        const match = url.match(/admin\.([^.]+)\./);
        return match ? match[1] : null;
    }

    function getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function setPageSize() {
        let selectElement = document.getElementById('pageSize');
        if (!selectElement) {
            console.error('Select element not found');
            return;
        }

        let option = document.createElement('option');
        option.value = '10000';
        option.text = '10000';
        selectElement.appendChild(option);
        selectElement.value = '10000';
        selectElement.dispatchEvent(new Event('change'));
    }

    window.addEventListener('load', function() {
        const currentUrl = window.location.href;

        if (currentUrl.includes('playersItems/update')) {
            createPopupBox()
            analyzeTransaction()
        }
        else if (currentUrl.includes('playersItems/transactionLog/')) {
        }
    });

})();
