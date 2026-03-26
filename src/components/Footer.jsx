import React from 'react'

const Footer = () => {
    function getCurrentYear() {
        return new Date().getFullYear();
      }
return (
    <footer className="app-footer">
            <p>&copy; {getCurrentYear()} MSA Quality Assurance. All rights reserved.</p>
    </footer>
)
}

export default Footer
