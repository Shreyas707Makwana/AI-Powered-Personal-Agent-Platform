// Simple event bus to open tool modals from outside Chat without lifting state
export const openWeatherTool = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-weather-tool'));
  }
};

export const openNewsTool = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-news-tool'));
  }
};
