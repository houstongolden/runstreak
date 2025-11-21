import { AppLayout } from "@/components/AppLayout";

export default function Privacy() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              RunStreaks ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application at https://runstreaks.io (the "Service").
            </p>
            <p>
              By using our Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">2.1 Information from Strava</h3>
            <p className="mb-4">
              When you connect your Strava account to RunStreaks, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Your Strava profile information (name, profile picture, location)</li>
              <li>Your running activities (date, distance, pace, duration, heart rate, cadence, and other performance metrics)</li>
              <li>Activity statistics and achievements</li>
              <li>Your Strava preferences and settings</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-4">2.2 Contact Information</h3>
            <p className="mb-4">
              We collect contact information you voluntarily provide:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Email address (for account communications and verification)</li>
              <li>Phone number (for SMS notifications, if you opt-in)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-4">2.3 Usage Information</h3>
            <p className="mb-4">
              We automatically collect certain information about your use of the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Pages visited and features used</li>
              <li>Date and time of access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calculate and display your daily run streak</li>
              <li>Display you on our leaderboard rankings</li>
              <li>Provide personalized running insights and AI coaching</li>
              <li>Send you account notifications and service updates</li>
              <li>Send SMS messages for streak reminders and accountability (if you opt-in)</li>
              <li>Improve and optimize our Service</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. SMS Messaging Program</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">4.1 Opt-In and Consent</h3>
            <p className="mb-4">
              By providing your phone number and completing phone verification through our Service, you expressly consent to receive recurring SMS messages from RunStreaks. This is a <strong>double opt-in process</strong>:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>You voluntarily provide your phone number through our web form</li>
              <li>You verify your phone number by entering a verification code sent to your device</li>
            </ol>
            <p className="mb-4">
              Only after both steps are complete will you receive messages from our messaging campaign.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.2 Message Types</h3>
            <p className="mb-4">You may receive the following types of messages:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Streak reminders:</strong> Notifications about time remaining to complete your daily run</li>
              <li><strong>Performance insights:</strong> Personalized AI-generated coaching messages about your running performance</li>
              <li><strong>Accountability notifications:</strong> Updates when your accountability partners complete their runs</li>
              <li><strong>Milestone celebrations:</strong> Congratulations on streak achievements and personal records</li>
              <li><strong>Account notifications:</strong> Important updates about your account or the Service</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-4">4.3 Message Frequency</h3>
            <p className="mb-4">
              Message frequency varies based on your settings and activity. You may receive up to 2 messages per day. Messages are only sent during the hours you configure in your settings.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.4 Opt-Out Instructions</h3>
            <p className="mb-4">
              You can opt-out of SMS messages at any time by:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Replying <strong>STOP</strong> to any message you receive</li>
              <li>Disabling SMS notifications in your account settings</li>
              <li>Emailing us at support@runstreaks.io</li>
            </ul>
            <p className="mb-4">
              After opting out, you will receive one final confirmation message. You can opt back in at any time through your account settings.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.5 Message and Data Rates</h3>
            <p className="mb-4">
              Message and data rates may apply based on your mobile carrier's plan. Please contact your mobile carrier for details about your plan.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.6 TCPA Compliance</h3>
            <p className="mb-4">
              By providing your phone number and opting in to SMS messages, you acknowledge that you are the subscriber or authorized user of the mobile phone number provided, and you have the authority to provide consent for us to contact you at that number. Your consent is not a condition of purchase or use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-medium mb-3 mt-4">5.1 Public Profile Information</h3>
            <p className="mb-4">
              Your profile information (name, profile picture, location, current streak, and running statistics) is publicly visible on our leaderboard and your profile page. This is essential to the Service's core functionality.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.2 Service Providers</h3>
            <p className="mb-4">We share information with third-party service providers who perform services on our behalf:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Vonage:</strong> SMS messaging platform for delivering notifications</li>
              <li><strong>Strava:</strong> Activity data synchronization and authentication</li>
              <li><strong>Hosting providers:</strong> Infrastructure and database hosting</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-4">5.3 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information if required by law or in response to valid legal process, such as a court order or subpoena.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.4 Business Transfers</h3>
            <p className="mb-4">
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="mb-4">
              We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as your account is active or as needed to provide you the Service. You may request deletion of your account and associated data by contacting us at support@runstreaks.io.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal information</li>
              <li><strong>Opt-out:</strong> Opt-out of SMS messages or email communications</li>
              <li><strong>Data portability:</strong> Request a copy of your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Users</h2>
            <p className="mb-4">
              If you are accessing the Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes your acknowledgment and acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mb-2">
              <strong>Email:</strong> support@runstreaks.io
            </p>
            <p className="mb-2">
              <strong>Website:</strong> https://runstreaks.io
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
