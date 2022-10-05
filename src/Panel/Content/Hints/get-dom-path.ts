/* eslint-disable no-plusplus,no-param-reassign */
const getDomPath = (element: Element) => {
    const stack = [];

    while (element.parentNode) {
        let sibCount = 0;
        let sibIndex = 0;

        for (
            let index = 0;
            index < element.parentNode.childNodes.length;
            index++
        ) {
            const sib = element.parentNode.childNodes[index];

            if (sib.nodeName === element.nodeName) {
                if (sib === element) {
                    sibIndex = sibCount;
                }
                sibCount++;
            }
        }

        if (element.hasAttribute('id') && element.id !== '') {
            stack.unshift(`${element.nodeName.toLowerCase()}#${element.id}`);
        } else if (
            element.classList.toString() !== '' &&
            element.tagName !== 'BODY'
        ) {
            stack.unshift(
                `${element.nodeName.toLowerCase()}.${element.classList.toString()}`
            );
        } else if (sibCount > 1) {
            stack.unshift(`${element.nodeName.toLowerCase()}:eq(${sibIndex})`);
        } else {
            stack.unshift(element.nodeName.toLowerCase());
        }

        element = element.parentNode as Element;
    }

    const toFilter = ['html', 'body', 'div#root'];

    return stack
        .filter((stackElement) => !toFilter.includes(stackElement))
        .join(' > ');
};

export default getDomPath;
