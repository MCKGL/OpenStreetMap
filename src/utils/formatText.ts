export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Cette fonction tronque un texte HTML à une longueur maximale spécifiée (si pas spécifiée, 270 caractères).
 * On va aussi essayer de ne pas couper les mots en deux, et de filtrer les sauts de ligne un peu
 * abusifs.
 * @param html
 * @param maxLength
 */
export function truncateHtmlSimple(html: string, maxLength: number = 270): string {
  if (!html) return '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let length = 0;
  let stop = false;
  let brCount = 0;

  function traverse(node: ChildNode): string {
    if (stop) return '';

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text.trim()) return '';

      brCount = 0;

      if (length + text.length > maxLength) {
        const remaining = maxLength - length;
        let truncatedText = text.slice(0, remaining);

        if (text.length > remaining) {
          const lastSpace = truncatedText.lastIndexOf(' ');
          if (lastSpace !== -1) {
            truncatedText = truncatedText.slice(0, lastSpace);
          }
        }

        stop = true;
        length = maxLength;
        return truncatedText + '…';
      } else {
        length += text.length;
        return text;
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (tagName === 'br') {
        if (brCount > 0) {
          // filtre les <br> (saut de ligne) consécutifs
          return '';
        } else {
          brCount++;
          return '<br>';
        }
      } else {
        brCount = 0;
      }

      let htmlStart = `<${tagName}`;
      for (const attr of el.attributes) {
        htmlStart += ` ${attr.name}="${attr.value}"`;
      }
      htmlStart += '>';

      let innerHtml = '';
      for (const child of Array.from(el.childNodes)) {
        innerHtml += traverse(child);
        if (stop) break;
      }

      return htmlStart + innerHtml + `</${tagName}>`;
    }

    return '';
  }

  return traverse(tempDiv);
}

