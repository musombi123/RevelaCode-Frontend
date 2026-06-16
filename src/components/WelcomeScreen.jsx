export default function WelcomeScreen() {
  return (
    <div className="text-center animate-fade-in">
      <div className="text-center animate-fade-in">

        {/* Brand mark (using favicon asset) */}
        <img
          src="/android-chrome-512x512.png"
          alt="RevelaCode"
          className="
            w-14
            mx-auto
            mb-6
            opacity-90
          "
        />

        <h1 className="
          text-4xl
          font-semibold
          tracking-tight
        ">
          How can I help today?
        </h1>

        <p className="
          mt-3
          text-gray-400
          max-w-md
          mx-auto
        ">
          Decode prophecy, study Scripture, and ask anything.
        </p>
      </div>
    </div>
  );
}