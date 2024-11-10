export function getHandler(type) {
    switch (type) {
        case 'user':
            return drawMessageUser;
        case 'agent':
            return drawMessageAgent;
        case 'response':
            return drawMessageResponse;
        case 'tool':
            return drawMessageTool;
        case 'code_exe':
            return drawMessageCodeExe;
        case 'warning':
            return drawMessageWarning;
        case 'rate_limit':
            return drawMessageWarning;
        case 'error':
            return drawMessageError;
        case 'info':
            return drawMessageInfo;
        case 'util':
            return drawMessageUtil;
        case 'hint':
            return drawMessageInfo;
        default:
            return drawMessageDefault;
    }
}


// draw a message with a specific type
export function _drawMessage(messageContainer, heading, content, temp, followUp, kvps = null, messageClasses = [], contentClasses = []) {

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', ...messageClasses);

    if (heading) {
        const headingElement = document.createElement('h4');
        headingElement.textContent = heading;
        messageDiv.appendChild(headingElement);
    }

    drawKvps(messageDiv, kvps);

    const preElement = document.createElement('pre');
    preElement.classList.add("msg-content", ...contentClasses);
    preElement.style.whiteSpace = 'pre-wrap';
    preElement.style.wordBreak = 'break-word';

    // Wrap content in a <span> to allow HTML parsing
    const spanElement = document.createElement('span');
    spanElement.innerHTML = content;  // Use innerHTML instead of textContent
    preElement.appendChild(spanElement);
    messageDiv.appendChild(preElement);
    messageContainer.appendChild(messageDiv);

    if (followUp) {
        messageContainer.classList.add("message-followup");
    }

    // Render LaTeX math within the span
    if (window.renderMathInElement) {
        renderMathInElement(spanElement, {
            delimiters: [
                { left: "$", right: "$", display: true },
                { left: "\\$", right: "\\$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\$", right: "\\$", display: false }
            ],
            throwOnError: false  // Prevent KaTeX from throwing errors
        });
    }

    return messageDiv;
}


export function drawMessageDefault(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, false, kvps, ['message-ai', 'message-default'], ['msg-json']);
}

export function drawMessageAgent(messageContainer, id, type, heading, content, temp, kvps = null) {
    let kvpsFlat = null;
    if (kvps) {
        kvpsFlat = { ...kvps, ...kvps['tool_args'] || {} };
        delete kvpsFlat['tool_args'];
    }

    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, false, kvpsFlat, ['message-ai', 'message-agent'], ['msg-json']);
}

export function drawMessageResponse(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, true, null, ['message-ai', 'message-agent-response']);
}

export function drawMessageDelegation(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, true, kvps, ['message-ai', 'message-agent', 'message-agent-delegation']);
}

export function drawMessageUser(messageContainer, id, type, heading, content, temp, kvps = null) {
    const hasContent = content && content.trim().length > 0;
    const hasAttachments = kvps && kvps.attachments && kvps.attachments.length > 0;

    // Only create message container if there's content or it's the initial message
    if (hasContent || !messageContainer.hasChildNodes()) {
        // Create the message with user heading and content
        _drawMessage(messageContainer, "User message", content, temp, false, null, ['message-user'], []);
    }

    // Render image attachments for user messages
    if (hasAttachments) {
        const attachmentsContainer = document.createElement('div');
        attachmentsContainer.classList.add('attachments-container');

        // Add "Attachments" heading if there's text content
        if (hasContent) {
            const attachmentsHeading = document.createElement('h4');
            attachmentsHeading.textContent = "Attachments";
            attachmentsContainer.appendChild(attachmentsHeading);
        }

        kvps.attachments.forEach(attachment => {
            const image = document.createElement('img');
            if (attachment.url) {
                image.src = attachment.url;
            } else if (attachment.data) {
                image.src = `data:image/jpeg;base64,${attachment.data}`;
            }
            image.alt = 'Attachment';
            image.classList.add('message-attachment');
            attachmentsContainer.appendChild(image);
        });

        messageContainer.appendChild(attachmentsContainer);
    }
}

export function drawMessageTool(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, true, kvps, ['message-ai', 'message-tool'], ['msg-output']);
}

export function drawMessageCodeExe(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, true, null, ['message-ai', 'message-code-exe']);
}

export function drawMessageAgentPlain(classes, messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, false, null, [...classes]);
    messageContainer.classList.add('center-container');
}

export function drawMessageInfo(messageContainer, id, type, heading, content, temp, kvps = null) {
    return drawMessageAgentPlain(['message-info'], messageContainer, id, type, heading, content, temp, kvps);
}

export function drawMessageUtil(messageContainer, id, type, heading, content, temp, kvps = null) {
    const messageContent = convertImageTags(content); // Convert image tags
    _drawMessage(messageContainer, heading, messageContent, temp, false, kvps, ['message-util'], ['msg-json']);
    messageContainer.classList.add('center-container');
}

export function drawMessageWarning(messageContainer, id, type, heading, content, temp, kvps = null) {
    return drawMessageAgentPlain(['message-warning'], messageContainer, id, type, heading, content, temp, kvps);
}

export function drawMessageError(messageContainer, id, type, heading, content, temp, kvps = null) {
    return drawMessageAgentPlain(['message-error'], messageContainer, id, type, heading, content, temp, kvps);
}

function drawKvps(container, kvps) {
    if (kvps) {
        const table = document.createElement('table');
        table.classList.add('msg-kvps');
        for (let [key, value] of Object.entries(kvps)) {
            const row = table.insertRow();
            row.classList.add('kvps-row');
            if (key === "thoughts" || key === "reflection") row.classList.add('msg-thoughts');

            const th = row.insertCell();
            th.textContent = convertToTitleCase(key);
            th.classList.add('kvps-key');

            const td = row.insertCell();
            const pre = document.createElement('pre');
            pre.classList.add('kvps-val');

            // if value is array, join it with new line
            if (Array.isArray(value)) value = value.join('\n');

            if (row.classList.contains('msg-thoughts')) {
                // Wrap content in a <span> to allow HTML parsing
                const span = document.createElement('span');
                span.innerHTML = value;  // Use innerHTML to enable KaTeX parsing
                pre.appendChild(span);
                td.appendChild(pre);

                // Render LaTeX math within the span
                if (window.renderMathInElement) {
                    renderMathInElement(span, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "\$$", right: "\$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\$$", right: "\$$", display: false }
                        ],
                        throwOnError: false  // Prevent KaTeX from throwing errors
                    });
                }
            } else {
                // For non-thought rows, use textContent as before
                pre.textContent = value;
                td.appendChild(pre);
            }
        }
        container.appendChild(table);
    }
}

function convertToTitleCase(str) {
    return str
        .replace(/_/g, ' ')  // Replace underscores with spaces
        .toLowerCase()       // Convert the entire string to lowercase
        .replace(/\b\w/g, function (match) {
            return match.toUpperCase();  // Capitalize the first letter of each word
        });
}


function convertImageTags(content) {
    // Regular expression to match <image> tags and extract base64 content
    const imageTagRegex = /<image>(.*?)<\/image>/g;

    // Replace <image> tags with <img> tags with base64 source
    const updatedContent = content.replace(imageTagRegex, (match, base64Content) => {
        return `<img src="data:image/jpeg;base64,${base64Content}" alt="Image Attachment" style="max-width: 250px !important;"/>`;
    });

    return updatedContent;
}
