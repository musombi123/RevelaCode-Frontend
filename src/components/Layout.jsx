import usePreferences from "./hooks/usePreferences.jsx";

export default function Layout({ children }) {
  const { fontSize } = usePreferences();

  const fontSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[fontSize];

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 ${fontSizeClass}`}>
      {children}
    </div>
  );
}
