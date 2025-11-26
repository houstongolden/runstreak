import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to RunStreaks. By accessing or using our web application at https://runstreaks.io (the "Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Your continued use of the Service following any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              RunStreaks is a web-based platform that tracks and displays daily running streaks by integrating with your Strava account. The Service provides:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Automated tracking of your daily running activities via Strava integration</li>
              <li>Personal profile pages with running statistics and achievements</li>
              <li>Activity heatmaps and performance analytics</li>
              <li>SMS notifications for streak reminders (optional)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Requirements</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">3.1 Strava Connection</h3>
            <p className="mb-4">
              To use RunStreaks, you must connect a valid Strava account. By connecting your Strava account, you authorize us to access your activity data as described in our Privacy Policy.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">3.2 Account Accuracy</h3>
            <p className="mb-4">
              You are responsible for maintaining the accuracy of your account information. You must provide accurate, current, and complete information during registration and keep your information updated.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">3.3 Account Security</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Streak Requirements and Rules</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">4.1 Daily Run Requirement</h3>
            <p className="mb-4">
              To maintain an active streak on RunStreaks, you must run at least <strong>1 mile per day</strong>. Activities are counted based on the date in your local timezone as configured in your Strava account.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.2 Activity Verification</h3>
            <p className="mb-4">
              All activities are automatically synced from Strava. RunStreaks relies on the accuracy and authenticity of data provided by Strava. We reserve the right to remove users from the leaderboard or Service if we detect fraudulent or manipulated activities.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">4.3 Streak Calculation</h3>
            <p className="mb-4">
              Your streak is calculated based on consecutive days with at least 1 mile of running activity. A gap of 2 or more days without a qualifying activity will break your streak. Your streak status is updated automatically as activities are synced from Strava.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. SMS Messaging Terms</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">5.1 Opt-In Requirement</h3>
            <p className="mb-4">
              SMS messaging is an optional feature. By providing your phone number and completing phone verification, you explicitly consent to receive recurring SMS messages from RunStreaks. This is a double opt-in process requiring both:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>Voluntary submission of your phone number through our web form</li>
              <li>Verification of your phone number via a code sent to your device</li>
            </ol>

            <h3 className="text-xl font-medium mb-3 mt-4">5.2 Message Content</h3>
            <p className="mb-4">
              You will receive transactional messages including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Streak countdown reminders</li>
              <li>Milestone achievements</li>
              <li>Account-related notifications</li>
            </ul>
            <p className="mb-4">
              We do not send promotional or marketing messages through SMS.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.3 Message Frequency</h3>
            <p className="mb-4">
              Message frequency varies based on your settings and activity. You may receive up to 2 messages per day during hours you configure. You can adjust frequency and timing in your account settings.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.4 Opt-Out Rights</h3>
            <p className="mb-4">
              You can opt-out of SMS messages at any time by:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Replying <strong>STOP</strong> to any message</li>
              <li>Disabling SMS notifications in your settings</li>
              <li>Contacting us at support@runstreaks.io</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-4">5.5 Costs</h3>
            <p className="mb-4">
              RunStreaks does not charge for SMS messages. However, message and data rates from your mobile carrier may apply. Contact your carrier for details about your plan.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.6 Support</h3>
            <p className="mb-4">
              For SMS support, reply <strong>HELP</strong> to any message or email us at support@runstreaks.io.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">5.7 Carrier Disclaimer</h3>
            <p className="mb-4">
              <strong>Carriers are not liable for delayed or undelivered messages.</strong> Message delivery is dependent on your mobile carrier's network and service availability. While we make every effort to ensure timely delivery of SMS notifications, RunStreaks and mobile carriers cannot guarantee delivery times or that all messages will be successfully delivered. Factors including network congestion, carrier outages, device settings, and signal strength may affect message delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload false, fraudulent, or manipulated activity data</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Scrape, copy, or collect data from the Service using automated means</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by RunStreaks and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              You retain ownership of your activity data. By using the Service, you grant us a license to use, display, and process your data as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="mb-4">
              The Service integrates with third-party services, including Strava. Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for the content, policies, or practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-4">9.1 Service "As Is"</h3>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">9.2 Accuracy</h3>
            <p className="mb-4">
              We do not guarantee the accuracy, completeness, or reliability of any content or data on the Service, including streak calculations and activity statistics. We rely on data provided by Strava and cannot verify the authenticity of all activities.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">9.3 Limitation of Liability</h3>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RUNSTREAKS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-4">9.4 Health and Safety</h3>
            <p className="mb-4">
              Running carries inherent risks. Consult with a healthcare professional before beginning any exercise program. RunStreaks is not responsible for any injuries or health issues that may result from your use of the Service or participation in running activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless RunStreaks and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, with or without notice. You may terminate your account at any time by disconnecting your Strava account or contacting us at support@runstreaks.io.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Modifications to the Service</h2>
            <p className="mb-4">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
            <p className="mb-4">
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive or equitable relief in court.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Severability</h2>
            <p className="mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Entire Agreement</h2>
            <p className="mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and RunStreaks regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
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
      <Footer />
    </>
  );
}
