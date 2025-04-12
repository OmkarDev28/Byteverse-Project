document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const createMobileMenu = () => {
        const header = document.querySelector('.header');
        const mainNav = document.querySelector('.main-nav');
        
        // Create mobile menu button
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.classList.add('mobile-menu-btn');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.style.display = 'none';
        
        // Insert before auth buttons
        const authButtons = document.querySelector('.auth-buttons');
        header.insertBefore(mobileMenuBtn, authButtons);
        
        // Toggle menu on click
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('show');
        });
        
        // Handle responsive menu
        const handleResponsiveMenu = () => {
            if (window.innerWidth <= 768) {
                mobileMenuBtn.style.display = 'block';
                mainNav.classList.remove('show');
            } else {
                mobileMenuBtn.style.display = 'none';
                mainNav.classList.remove('show');
            }
        };
        
        // Initial check
        handleResponsiveMenu();
        
        // Listen for window resize
        window.addEventListener('resize', handleResponsiveMenu);
    };
    
    // Search functionality
    const setupSearch = () => {
        const searchInput = document.querySelector('.search-box input');
        const tags = document.querySelectorAll('.tag');
        
        // Click on tag to add to search
        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                searchInput.value = tag.textContent;
                searchInput.focus();
                showNotification(`Searching for ${tag.textContent} issues...`);
            });
        });
        
        // Add search animation
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.style.boxShadow = '0 0 0 2px var(--primary-color)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.style.boxShadow = 'none';
        });
        
        // Search on enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                showNotification(`Searching for "${searchInput.value}" issues...`);
            }
        });
    };
    
    // Category cards hover effects
    const setupCategoryCards = () => {
        const categoryCards = document.querySelectorAll('.category-card');
        
        categoryCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.icon');
                icon.style.transform = 'scale(1.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.icon');
                icon.style.transform = 'scale(1)';
            });
            
            // Make cards clickable
            card.addEventListener('click', () => {
                // Simulate navigation to category page
                const categoryName = card.querySelector('span').textContent;
                showNotification(`Navigating to ${categoryName}...`);
            });
        });
    };
    
    // Stats counter animation
    const animateStats = () => {
        const statValues = document.querySelectorAll('.stat-value');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const value = target.textContent;
                    
                    // Extract number and suffix
                    const match = value.match(/^(\d+)(.*)$/);
                    if (match) {
                        const number = parseInt(match[1]);
                        const suffix = match[2];
                        
                        // Animate from 0 to the number
                        let start = 0;
                        const duration = 2000; // 2 seconds
                        const step = number / (duration / 16); // 60fps
                        
                        const animate = () => {
                            start += step;
                            if (start < number) {
                                target.textContent = Math.floor(start) + suffix;
                                requestAnimationFrame(animate);
                            } else {
                                target.textContent = value;
                            }
                        };
                        
                        animate();
                        observer.unobserve(target);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        statValues.forEach(value => {
            observer.observe(value);
        });
    };
    
    // Poll voting system
    const setupPolls = () => {
        const pollOptions = document.querySelectorAll('.poll-option');
        
        pollOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Get parent poll container
                const pollContainer = option.closest('.issue-poll');
                const pollQuestion = pollContainer.querySelector('h4').textContent;
                const pollLabel = option.querySelector('.poll-label').textContent;
                
                // Show loading
                showLoading();
                
                // Simulate API call
                setTimeout(() => {
                    // Update progress bars (in a real app, this would come from the server)
                    const progressBar = option.querySelector('.poll-progress');
                    const currentWidth = parseInt(progressBar.style.width);
                    const newWidth = Math.min(currentWidth + 2, 100);
                    progressBar.style.width = `${newWidth}%`;
                    progressBar.textContent = `${newWidth}%`;
                    
                    // Update vote count
                    const votesElement = option.closest('.issue-poll').querySelector('.poll-votes');
                    const currentVotes = parseInt(votesElement.textContent);
                    votesElement.textContent = `${currentVotes + 1} votes`;
                    
                    // Hide loading
                    hideLoading();
                    
                    // Show notification
                    showNotification(`You voted "${pollLabel}" on "${pollQuestion}"`);
                }, 800);
            });
        });
    };
    
    // Action buttons
    const setupActionButtons = () => {
        const raiseIssueBtn = document.querySelector('.action-buttons .btn-primary');
        const viewCasesBtn = document.querySelector('.action-buttons .btn-outline');
        
        raiseIssueBtn.addEventListener('click', () => {
            const modal = document.getElementById('issueModal');
            modal.classList.add('active');
        });
        
        viewCasesBtn.addEventListener('click', () => {
            showNotification('Navigating to Active Cases...');
        });
        
        // Close modal
        const closeModalBtn = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelIssue');
        
        const closeModal = () => {
            const modal = document.getElementById('issueModal');
            modal.classList.remove('active');
        };
        
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('issueModal');
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Handle form submission
        const issueForm = document.getElementById('issueForm');
        issueForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Show loading
            showLoading();
            
            // Simulate API call
            setTimeout(() => {
                closeModal();
                hideLoading();
                showNotification('Your issue has been submitted successfully!');
                issueForm.reset();
                document.getElementById('imagePreview').style.display = 'none';
            }, 1500);
        });
        
        // Image preview
        const issueImage = document.getElementById('issueImage');
        const imagePreview = document.getElementById('imagePreview');
        
        issueImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    // Create image element
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    
                    // Clear previous preview
                    imagePreview.innerHTML = '';
                    imagePreview.appendChild(img);
                    imagePreview.style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            }
        });
    };
    
    // Notification system
    const showNotification = (message) => {
        // Get notification element
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        // Set message
        notificationMessage.textContent = message;
        
        // Show notification
        notification.classList.add('active');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
        
        // Close button
        const closeBtn = document.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('active');
        });
    };
    
    // Loading spinner
    const showLoading = () => {
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.add('active');
    };
    
    const hideLoading = () => {
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.remove('active');
    };
    
    // Issue card interactions
    const setupIssueCards = () => {
        const issueCards = document.querySelectorAll('.issue-card');
        
        issueCards.forEach(card => {
            // Add hover effect
            card.addEventListener('mouseenter', () => {
                const img = card.querySelector('.issue-image img');
                img.style.transform = 'scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                const img = card.querySelector('.issue-image img');
                img.style.transform = 'scale(1)';
            });
            
            // Make title clickable
            const title = card.querySelector('.issue-title');
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                showNotification(`Viewing details for "${title.textContent}"`);
            });
            
            // Share button
            const shareBtn = card.querySelector('.action-btn:nth-child(3)');
            shareBtn.addEventListener('click', () => {
                const title = card.querySelector('.issue-title').textContent;
                showNotification(`Sharing "${title}" with others`);
            });
            
            // Report button
            const reportBtn = card.querySelector('.action-btn:nth-child(4)');
            reportBtn.addEventListener('click', () => {
                const title = card.querySelector('.issue-title').textContent;
                showNotification(`Reporting issue: "${title}"`);
            });
        });
    };
    
    // Initialize all features
    createMobileMenu();
    setupSearch();
    setupCategoryCards();
    animateStats();
    setupPolls();
    setupActionButtons();
    setupIssueCards();
    
    // Show welcome notification after a delay
    setTimeout(() => {
        showNotification('Welcome to CivicSync! Explore civic issues in your community.');
    }, 1000);
});