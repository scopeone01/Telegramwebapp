/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPE DEFINITIONS ---
interface HapticFeedback {
    notificationOccurred(type: 'success' | 'warning' | 'error'): void;
}

interface TelegramWebApp {
    ready(): void;
    sendData(data: string): void;
    HapticFeedback: HapticFeedback;
}

declare global {
    interface Window {
        Telegram: {
            WebApp: TelegramWebApp;
        };
    }
}

interface SensorData {
    ph?: number;
    aht_temp?: number;
    aht_humid?: number;
    'ds-temp-1'?: number;
}

// --- MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const relaysContainer = document.getElementById('relays');
    const saveLimitsButton = document.getElementById('saveLimits');
    const container = document.querySelector('.container');
    const refreshStatusButton = document.getElementById('refreshStatus');
    const statusLoadingOverlay = document.getElementById('status-loading');

    // --- LIVE STATUS FUNCTIONS ---
    const updateStatusUI = (data: SensorData) => {
        const phElement = document.getElementById('status-ph');
        if (phElement) {
            phElement.textContent = data.ph?.toFixed(2) ?? '--';
        }

        const ahtTempElement = document.getElementById('status-aht-temp');
        if (ahtTempElement) {
            ahtTempElement.textContent = data.aht_temp?.toFixed(1) + ' °C' ?? '-- °C';
        }

        const ahtHumidElement = document.getElementById('status-aht-humid');
        if (ahtHumidElement) {
            ahtHumidElement.textContent = data.aht_humid?.toFixed(1) + ' %' ?? '-- %';
        }

        const dsTemp1Element = document.getElementById('status-ds-temp-1');
        if (dsTemp1Element) {
            dsTemp1Element.textContent = data['ds-temp-1']?.toFixed(1) + ' °C' ?? '-- °C';
        }
    };

    const fetchAndDisplayStatus = () => {
        if(statusLoadingOverlay) statusLoadingOverlay.classList.remove('hidden');

        // Note: The Mini App cannot directly receive data back from the bot via sendData.
        // For this to work, the ESP32 bot needs to be updated to:
        // 1. Handle a new command, e.g., "/get_status_json"
        // 2. Respond to that command using a mechanism that can deliver data to the app,
        //    like the Telegram Bot API's `answerWebAppQuery` method.
        // 3. The Mini App would then need a listener for the resulting event.
        //
        // As a placeholder, we use dummy data to demonstrate the UI.
        tg.sendData(JSON.stringify({ type: 'query', text: '/get_status_json' }));

        setTimeout(() => {
            const dummyData: SensorData = {
                ph: 7.82 + (Math.random() - 0.5) * 0.2,
                aht_temp: 24.5 + (Math.random() - 0.5),
                aht_humid: 55.2 + (Math.random() - 0.5) * 5,
                'ds-temp-1': 22.8 + (Math.random() - 0.5),
            };
            updateStatusUI(dummyData);
            if(statusLoadingOverlay) statusLoadingOverlay.classList.add('hidden');
        }, 800); // Simulate network delay
    };

    // Initial status fetch
    fetchAndDisplayStatus();

    // Refresh button listener
    if (refreshStatusButton) {
        refreshStatusButton.addEventListener('click', fetchAndDisplayStatus);
    }

    // --- DYNAMIC RELAY GENERATION ---
    if (relaysContainer) {
        for (let i = 1; i <= 8; i++) {
            const relayId = `relay-${i}`;
            const relayItem = document.createElement('div');
            relayItem.className = 'relay-item';
            
            const label = document.createElement('label');
            label.htmlFor = relayId;
            label.textContent = `Relais ${i}`;
            
            const toggleSwitch = document.createElement('label');
            toggleSwitch.className = 'toggle-switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = relayId;
            input.dataset.relayIndex = String(i);
            const slider = document.createElement('span');
            slider.className = 'slider';
            
            toggleSwitch.appendChild(input);
            toggleSwitch.appendChild(slider);
            
            relayItem.appendChild(label);
            relayItem.appendChild(toggleSwitch);
            
            relaysContainer.appendChild(relayItem);
        }
    }
    
    // --- GENERAL EVENT LISTENER ---
    if (container) {
        container.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            const actionButton = target.closest<HTMLElement>('[data-action]');
            if (actionButton) {
                const actionData = actionButton.dataset.action;
                if (actionData) {
                    tg.sendData(actionData);
                }

                // If the button is part of a segmented control, handle active state
                if (actionButton.classList.contains('segment')) {
                    const group = actionButton.closest('.segmented');
                    if (group) {
                        group.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
                        actionButton.classList.add('active');
                    }
                }
            }
        });
    }

    // Handle relay toggle switches separately for immediate feedback
    if (relaysContainer) {
       relaysContainer.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            if (target.type === 'checkbox' && target.dataset.relayIndex) {
                const index = target.dataset.relayIndex;
                const state = target.checked ? 'on' : 'off';
                const command = {
                    type: 'cmd',
                    text: `/relay ${index} ${state}`
                };
                tg.sendData(JSON.stringify(command));
            }
       });
    }

    // Handle save limits button
    if (saveLimitsButton) {
        saveLimitsButton.addEventListener('click', () => {
            const commands: string[] = [];
            const fields = [
                { id: 'phmin', cmd: 'phmin' },
                { id: 'phmax', cmd: 'phmax' },
                { id: 'tmin', cmd: 'tmin' },
                { id: 'tmax', cmd: 'tmax' },
                { id: 'hmin', cmd: 'hmin' },
                { id: 'hmax', cmd: 'hmax' },
            ];

            fields.forEach(field => {
                const input = document.getElementById(field.id) as HTMLInputElement;
                if (input && input.value !== '') {
                    commands.push(`/set ${field.cmd} ${input.value}`);
                }
            });

            if (commands.length > 0) {
                const data = {
                    type: 'batch',
                    commands: commands
                };
                tg.sendData(JSON.stringify(data));
                tg.HapticFeedback.notificationOccurred('success');
            } else {
                 tg.HapticFeedback.notificationOccurred('warning');
            }
        });
    }
});

export {};
