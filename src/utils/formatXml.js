// src/utils/formatXml.js
import xmlFormatter from 'xml-formatter';

/**
 * Formats an XML string with 4-space indents.
 */
export function formatXML(xml) {
  try {
    return xmlFormatter(xml, {
      indentation: '    ', // four spaces
      collapseContent: true, // ensure children are always on new lines
      lineSeparator: '\n' // use LF
    });
  } catch {
    return xml;
  }
}
