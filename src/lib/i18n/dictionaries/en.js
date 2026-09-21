/**
 * English UI strings — mirrors id.js key-for-key. See that file's header
 * comment for what is and isn't covered.
 */
export default {
	nav: {
		home: 'HOME',
		projects: 'PROJECTS',
		articles: 'ARTICLES',
		messages: 'MESSAGES',
		contact: 'CONTACT',
		language: 'LANGUAGE',
		unavailableMessage: 'Sorry, this feature is still under development.',
		ok: 'OK, Got It'
	},

	common: {
		role: 'Role :',
		duration: 'Duration :',
		categories: 'Categories :',
		seeMoreProject: 'See More Project',
		viewProjectAria: 'View Project',
		viewProjectWithTitleAria: (title) => `View project: ${title}`
	},

	home: {
		curriculumVitae: 'Curriculum Vitae',
		resume: 'Resume',
		summaryTitle: 'SUMMARY',
		workExperienceHashtag: '#WORK EXPERIENCE',
		relatedSkillsTitle: 'RELATED SKILLS',
		projectsTitle: 'PROJECTS'
	},

	projectsListing: {
		searchLabel: 'Search',
		filterLabel: 'Filter',
		searchPlaceholder: 'Search projects...',
		filterProjectsTitle: 'Filter Projects',
		resetAll: 'Reset All',
		sortBy: 'Sort By',
		category: 'Category',
		sortLabels: { newest: 'Newest', oldest: 'Oldest', asc: 'A → Z', desc: 'Z → A' },
		categoryLabels: { all: 'All', web: 'Web', app: 'App', design: 'Design' },
		noProjectsFound: 'No projects match this search/filter.',
		prev: 'Prev',
		next: 'Next',
		prevAria: 'Previous page',
		nextAria: 'Next page'
	},

	projectDetail: {
		contributor: 'Contributor :',
		associatedWith: 'Associated with :',
		categories: 'Categories :',
		dates: 'Dates :',
		duration: 'Duration :',
		roles: 'Roles :',
		requestEditLink: 'Request Edit',
		seeLiveProject: 'SEE LIVE PROJECT',
		otherProjectsTitle: 'OTHER PROJECTS',
		slideAria: (n) => `View documentation slide ${n}`
	},

	requestEdit: {
		pageTitle: (title) => `Request Edit — ${title}`,
		thankYouTitle: 'Thank you!',
		thankYouBefore: 'Your edit request for',
		thankYouAfter: 'has been submitted and is awaiting admin review. The changes will go live once approved.',
		backToProject: '← Back to project',
		requestEditTitle: (title) => `Request Edit: ${title}`,
		step1Intro: 'Before continuing, we need to know who is proposing this change.',
		nameLabel: 'Name',
		instagramLabel: 'Instagram Username',
		instagramPlaceholder: 'without @',
		whatsappLabel: 'WhatsApp Number (optional)',
		continueToEdit: 'Continue to Edit',
		cancel: 'Cancel',
		editTitle: (title) => `Edit: ${title}`,
		step2Intro:
			'Your changes will be reviewed by the admin before going live on the public page. The "Documentation Slides" list below is pre-filled with the current slides — edit, remove, or add rows as needed; the final list you submit will replace the existing slides.',
		submitLabel: 'Submit Edit Request'
	},

	footer: {
		testimonialLabel: 'TESTIMONIAL',
		noTestimonial: 'No testimonials yet.',
		leaveMessageTitle: 'LEAVE A MESSAGE',
		leaveMessageDesc:
			"Hi, I really appreciate it if you'd leave a review or any message. Don't worry, anonymous messages are possible too — just check the anonymous option.",
		sendMessages: 'Send Message',
		readMessages: 'Read Messages',
		copyBtn: 'COPY',
		emailCopiedToast: (email) => `Email copied to clipboard: ${email}`,
		emailFallbackToast: (email) => `Email: ${email}`
	},

	messageModal: {
		title: 'Leave a Review or Message',
		photoLabel: 'Photo',
		optionalBadge: 'optional',
		uploading: 'Uploading...',
		changePhoto: 'Change photo',
		clickToUploadPhoto: 'Click to upload photo',
		yourName: 'Your Name',
		namePlaceholder: 'e.g. Abraham',
		instagramOptional: 'Instagram (optional)',
		instagramPlaceholder: '@username',
		sendAsAnonymous: 'Send as Anonymous Element',
		projectTogether: 'Project we worked on together (optional)',
		noneSkipOption: '— None / skip —',
		newProjectOption: '+ A project not listed here',
		projectNamePlaceholder: 'Project name',
		newProjectHint: "Adding a new project can't be anonymous — your name is required.",
		yourMessage: 'Your Message / Feedback',
		messagePlaceholder: 'Write your message here...',
		sending: 'Sending...',
		submit: 'Submit Message',
		sentToast: 'Message sent successfully! Thank you.',
		failedGeneric: 'Failed to send message.',
		errorGeneric: 'Something went wrong. Please try again.',
		uploadFailed: 'Upload failed.'
	},

	readModal: {
		title: 'Answered Messages & Feedback',
		noAnswered: 'No answered messages yet.',
		anonymousLabel: 'Anonymous Element'
	}
};
