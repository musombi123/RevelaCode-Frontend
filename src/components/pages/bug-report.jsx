import React from "react";

const BugReport = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Report a Bug</h1>
      <p className="text-gray-600">
        We’re working on a bug report form. For now, please email us at{" "}
        <a href="mailto:support@revelacode.com" className="text-blue-600 underline">
          support@revelacode.com
        </a>.
      </p>
    </div>
  );
};

export default BugReport;
