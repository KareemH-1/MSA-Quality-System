import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  BriefcaseBusiness,
  FileText,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import api from "../api/axios";
import "../styles/Contact.css";
import CampusImage from "../assets/MSA_Campus.jpg";
import Logo from "../assets/MSA_Logo.png";

const SUPPORT_CHANNELS = [
  {
    title: "Technical Support",
    subtitle:
      "Assistance with system authentication, data import protocols, and QA portal troubleshooting.",
    icon: ShieldCheck,
    contact: "info@msa.edu.eg",
    extension: "Hotline: 16672",
    isFeatured: false,
  },
  {
    title: "Academic Inquiries",
    subtitle:
      "Guidance for Module Leaders and Instructors regarding academic appeal frameworks and grading standards.",
    icon: BriefcaseBusiness,
    contact: "admission@msa.edu.eg",
    extension: "Graduates Affairs: sgaffairs@msa.edu.eg",
    isFeatured: true,
  },
  {
    title: "Administrative Help",
    subtitle:
      "General queries about institutional QA processes, documentation deadlines, and scheduling.",
    icon: FileText,
    contact: "Landline: 38371113 / 38371115",
    extension: "International Landline: 002-0216672",
    isFeatured: false,
  },
];

const FAQ_ITEMS = [
  {
    question: "System login issues?",
    answer:
      "Use your institutional email and make sure VPN/proxy settings are disabled during login. If access fails, contact Hotline 16672 or email info@msa.edu.eg.",
  },
  {
    question: "Documentation templates",
    answer:
      "Templates for forms and submissions are available through the Academic Inquiries office. Request them at admission@msa.edu.eg.",
  },
  {
    question: "Appeal submission guide",
    answer:
      "Submit your appeal with course details and supporting files before deadline. For formal guidance, reach out to sgaffairs@msa.edu.eg.",
  },
  {
    question: "Office working time",
    answer:
      "Saturday to Thursday: 08:00 - 3:15. Friday and official holidays: Closed.",
  },
];

const MAPS_URL =
  "https://www.google.com/maps?ll=29.956701,30.957946&z=15&t=m&hl=en-US&gl=US&mapclient=embed&cid=13974955029719988132";

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    category: "Technical Support",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(-1);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await api.post("/View/TicketView.php?action=create", {
        fullName: formData.fullName,
        email: formData.email,
        category: formData.category,
        message: formData.message,
      });

      if (response.data?.status === "success") {
        setIsSubmitted(true);
        setFormData({
          fullName: "",
          email: "",
          category: "Technical Support",
          message: "",
        });
      } else {
        setSubmitError(response.data?.message || "Failed to submit ticket.");
        setIsSubmitted(false);
      }
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || error.message || "Failed to submit ticket.",
      );
      setIsSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleFaq(index) {
    setOpenFaqIndex((prev) => (prev === index ? -1 : index));
  }

  return (
    <section className="contact-page">
      <div className="contact-shell">
      <nav className="contact-navbar">
        <div className="contact-navbar-logo">
          <img src={Logo} alt="MSA University Logo" className="contact-navbar-image" />
          <h2>MSA Quality System</h2>
        </div>

        <Link to="/" className="contact-home-link">Home</Link>
      </nav>

      <header className="contact-hero">
        <p className="contact-hero-kicker">Support & Assistance</p>
        <h1>Connecting Institutions with Excellence</h1>
        <p>
          Our dedicated teams provide technical, academic, and administrative support
          to maintain the highest standards of quality assurance at MSA University.
        </p>
      </header>

      <div className="support-cards" aria-label="Support channels">
        {SUPPORT_CHANNELS.map((channel) => {
          const Icon = channel.icon;

          return (
            <article
              className={`support-card ${channel.isFeatured ? "featured" : ""}`}
              key={channel.title}
            >
              <div className="support-card-icon">
                <Icon size={16} />
              </div>
              <h2>{channel.title}</h2>
              <p>{channel.subtitle}</p>
              {channel.contact.includes("@") ? (
                <a href={`mailto:${channel.contact}`} className="support-card-contact">
                  <Mail size={12} />
                  {channel.contact}
                </a>
              ) : (
                <p className="support-card-contact">
                  <Phone size={12} />
                  {channel.contact}
                </p>
              )}
              <p className="support-card-ext">
                <Phone size={12} />
                {channel.extension}
              </p>
            </article>
          );
        })}
      </div>

      <div className="contact-content-grid">
        <section className="contact-form-panel" aria-label="Formal inquiry submission">
          <h2>Formal Inquiry Submission</h2>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-row">
              <div className="contact-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Kareem Ahmed"
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="email">Institutional Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="kareem.ahmed15@msa.edu.eg"
                  required
                />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="category">Inquiry Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Technical Support">Technical Support</option>
                <option value="Academic Inquiries">Academic Inquiries</option>
                <option value="Administrative Help">Administrative Help</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="message">Message Detail</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="Please describe your inquiry in detail..."
                required
              />
            </div>

            <div className="contact-form-actions">
              <button type="submit" className="contact-submit-btn" disabled={isLoading}>
                Submit Inquiry
              </button>
            </div>

            {submitError && (
              <p className="contact-success-msg" role="alert">
                {submitError}
              </p>
            )}

            {isSubmitted && (
              <p className="contact-success-msg" role="status">
                Inquiry submitted successfully. Our team will follow up soon.
              </p>
            )}
          </form>
        </section>

        <aside className="contact-side-stack" aria-label="Office and FAQs">
          <section className="contact-office-panel">
            <h2>Office Location</h2>
            <a
              className="office-image-wrap"
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open MSA 6th October campus on Google Maps"
            >
              <img src={CampusImage} alt="MSA University Campus" />
              <div className="office-overlay-pin">
                <MapPin size={16} />
              </div>
              <div className="office-overlay-card">
                <h3>MSA - 6th Oct. Campus</h3>
                <p>26 July Mehwar Rd intersection with Wahat Rd, 6th October, Egypt</p>
              </div>
            </a>

            <div className="office-contact-details">
              <p><strong>Address:</strong> 26 July Mehwar Road intersection with Wahat Road, 6th October City, Egypt.</p>
              <p><strong>Postal Code:</strong> 12451</p>
              <p><strong>Hotline:</strong> 16672</p>
              <p><strong>Work Time:</strong> Saturday - Thursday: 08:00 - 3:15</p>
              <p><strong>Closed:</strong> Friday / Official Holidays</p>
            </div>
          </section>

          <section className="contact-faq-panel">
            <h2>Quick Access FAQs</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => (
                <article
                  className={`faq-item ${openFaqIndex === index ? "open" : ""}`}
                  key={item.question}
                >
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={openFaqIndex === index}
                  >
                    <span>{item.question}</span>
                    <ChevronDown size={16} className="faq-chevron" />
                  </button>

                  {openFaqIndex === index && <p className="faq-answer">{item.answer}</p>}
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
      </div>
    </section>
  );
};

export default Contact;
