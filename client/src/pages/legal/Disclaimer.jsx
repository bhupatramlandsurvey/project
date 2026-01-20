import React from "react";

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">Disclaimer</h1>

      <p className="mb-4">
        The information and documents provided by 
        <strong> BHUPATRAM LAND SURVEYS (OPC) PRIVATE LIMITED </strong> 
        are based on the details submitted by the customer.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Accuracy of Information</h2>
      <p className="mb-4">
        While we strive for accuracy, we are not responsible for errors caused by:
        • Incorrect details provided by the user<br />
        • Government records mismatch<br />
        • External data sources
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">No Legal Liability</h2>
      <p className="mb-4">
        Documents delivered through our service should be used for reference only. 
        We do not guarantee legal validity unless specified.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">External Links</h2>
      <p>
        Any external website links, if present, are not controlled by us. We are 
        not responsible for their content or accuracy.
      </p>
    </div>
  );
}
