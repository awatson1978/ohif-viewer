import { LabelTool, addTool, annotation } from '@cornerstonejs/tools';

/**
 * Initialize custom tools for the extension
 */
export default function initTools() {
  addTool(LabelTool);

  const annotationStyle = {
    textBoxFontSize: '15px',
    lineWidth: '1.5',
  };

  const defaultStyles = annotation.config.style.getDefaultToolStyles();
  annotation.config.style.setDefaultToolStyles({
    global: {
      ...defaultStyles.global,
      ...annotationStyle,
    },
  });
}

export const toolNames = {
  Text: LabelTool.toolName,
};
