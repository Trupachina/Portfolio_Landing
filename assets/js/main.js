(() => {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  const projectLinks = window.PROJECT_LINKS || {};
  const projectMedia = window.PROJECT_MEDIA || {};

  if (!data) {
    console.error("PORTFOLIO_DATA не найден.");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  };

  const linkLabels = {
    demo: "Демо",
    github: "GitHub",
    video: "Видео",
    presentation: "Презентация",
    documentation: "Документация"
  };

  const getMedia = (project) => {
    const media = Array.isArray(projectMedia[project.id]) ? projectMedia[project.id] : [];
    return media
      .map((item, index) => {
        if (typeof item === "string") {
          return { src: item, alt: `${project.title} — изображение ${index + 1}`, caption: "" };
        }
        return {
          src: String(item?.src || ""),
          alt: String(item?.alt || `${project.title} — изображение ${index + 1}`),
          caption: String(item?.caption || "")
        };
      })
      .filter((item) => item.src);
  };

  const getLinks = (project) => {
    const links = projectLinks[project.id] || {};
    return Object.entries(linkLabels)
      .filter(([key]) => typeof links[key] === "string" && links[key].trim())
      .map(([key, label]) => ({ key, label, href: links[key].trim() }));
  };

  const createExternalLink = (link, compact = false) => {
    const anchor = create("a", compact ? "project-link project-link-compact" : "project-link", link.label);
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    return anchor;
  };

  let galleryItems = [];
  let galleryIndex = 0;
  const galleryModal = $("[data-gallery-modal]");
  const galleryImage = $("[data-gallery-image]");
  const galleryCaption = $("[data-gallery-caption]");
  const galleryCounter = $("[data-gallery-counter]");
  const galleryThumbs = $("[data-gallery-thumbs]");

  const updateGallery = () => {
    if (!galleryItems.length || !galleryImage) return;
    const item = galleryItems[galleryIndex];
    galleryImage.src = item.src;
    galleryImage.alt = item.alt;
    galleryCaption.textContent = item.caption;
    galleryCaption.hidden = !item.caption;
    galleryCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;

    $$("button", galleryThumbs).forEach((button, index) => {
      button.classList.toggle("is-active", index === galleryIndex);
      button.setAttribute("aria-current", index === galleryIndex ? "true" : "false");
    });
  };

  const openGallery = (items, startIndex = 0) => {
    if (!galleryModal || !items.length) return;
    galleryItems = items;
    galleryIndex = Math.max(0, Math.min(startIndex, items.length - 1));
    galleryThumbs.replaceChildren();

    items.forEach((item, index) => {
      const button = create("button", "gallery-thumb");
      button.type = "button";
      button.setAttribute("aria-label", `Открыть изображение ${index + 1}`);
      const image = create("img");
      image.src = item.src;
      image.alt = "";
      button.append(image);
      button.addEventListener("click", () => {
        galleryIndex = index;
        updateGallery();
      });
      galleryThumbs.append(button);
    });

    updateGallery();
    galleryModal.hidden = false;
    document.body.classList.add("modal-open");
  };

  const closeGallery = () => {
    if (!galleryModal) return;
    galleryModal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  const stepGallery = (direction) => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
    updateGallery();
  };

  $("[data-gallery-prev]")?.addEventListener("click", () => stepGallery(-1));
  $("[data-gallery-next]")?.addEventListener("click", () => stepGallery(1));
  $$('[data-gallery-close]').forEach((node) => node.addEventListener("click", closeGallery));

  const createCardGallery = (project, media) => {
    if (!media.length) return null;

    let index = 0;
    const gallery = create("div", "card-gallery");
    const button = create("button", "card-gallery-main");
    button.type = "button";
    button.setAttribute("aria-label", `Открыть галерею проекта «${project.title}»`);

    const image = create("img");
    image.src = media[0].src;
    image.alt = media[0].alt;
    image.loading = project.featured ? "eager" : "lazy";
    image.decoding = "async";
    button.append(image);
    button.addEventListener("click", () => openGallery(media, index));

    const counter = create("span", "card-gallery-counter", `1 / ${media.length}`);
    gallery.append(button, counter);

    if (media.length > 1) {
      const prev = create("button", "card-gallery-arrow card-gallery-prev", "‹");
      const next = create("button", "card-gallery-arrow card-gallery-next", "›");
      prev.type = next.type = "button";
      prev.setAttribute("aria-label", "Предыдущее изображение");
      next.setAttribute("aria-label", "Следующее изображение");

      const setIndex = (value) => {
        index = (value + media.length) % media.length;
        image.src = media[index].src;
        image.alt = media[index].alt;
        counter.textContent = `${index + 1} / ${media.length}`;
      };

      prev.addEventListener("click", (event) => {
        event.stopPropagation();
        setIndex(index - 1);
      });
      next.addEventListener("click", (event) => {
        event.stopPropagation();
        setIndex(index + 1);
      });
      gallery.append(prev, next);
    }

    image.addEventListener("error", () => gallery.remove(), { once: true });
    return gallery;
  };

  const projectModal = $("[data-project-modal]");
  const projectModalContent = $("[data-project-modal-content]");

  const closeProjectModal = () => {
    if (!projectModal) return;
    projectModal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  $$('[data-project-close]').forEach((node) => node.addEventListener("click", closeProjectModal));

  const openProjectModal = (project) => {
    if (!projectModal || !projectModalContent || project.placeholder) return;

    const media = getMedia(project);
    const links = getLinks(project);
    const group = data.groups.find((item) => item.id === project.group);

    const header = create("header", "project-modal-header");
    const meta = create("div", "project-meta");
    meta.append(create("span", "project-group-label", group?.label || project.group));
    meta.append(create("span", "project-status", project.status));
    header.append(meta, create("h2", "", project.title), create("p", "project-subtitle", project.subtitle));

    const nodes = [header];

    if (media.length) {
      const gallery = create("div", "modal-gallery-grid");
      media.forEach((item, index) => {
        const button = create("button", "modal-gallery-item");
        button.type = "button";
        const image = create("img");
        image.src = item.src;
        image.alt = item.alt;
        button.append(image);
        button.addEventListener("click", () => openGallery(media, index));
        gallery.append(button);
      });
      nodes.push(gallery);
    }

    nodes.push(create("p", "project-modal-summary", project.summary));

    const role = create("div", "project-role");
    role.append(create("span", "", "Моя работа"));
    role.append(create("strong", "", project.role));
    nodes.push(role);

    if (project.results.length) {
      nodes.push(create("h3", "modal-section-title", "Что реализовано"));
      const list = create("ul", "modal-results");
      project.results.forEach((result) => list.append(create("li", "", result)));
      nodes.push(list);
    }

    const tags = create("div", "project-tags");
    project.tags.forEach((tag) => tags.append(create("span", "tag", tag)));
    nodes.push(tags);

    if (links.length) {
      const linksRoot = create("div", "modal-links");
      links.forEach((link) => linksRoot.append(createExternalLink(link)));
      nodes.push(linksRoot);
    }

    projectModalContent.replaceChildren(...nodes);
    projectModal.hidden = false;
    document.body.classList.add("modal-open");
  };

  const createProjectCard = (project) => {
    const group = data.groups.find((item) => item.id === project.group);
    const media = getMedia(project);
    const links = getLinks(project);
    const card = create("article", `project-card reveal${project.featured ? " project-card-featured" : ""}${project.placeholder ? " project-card-placeholder" : ""}`);
    card.dataset.categories = project.categories.join(" ");

    const cardMedia = createCardGallery(project, media);
    if (cardMedia) card.append(cardMedia);

    const body = create("div", "project-body");
    const meta = create("div", "project-meta");
    meta.append(create("span", "project-group-label", group?.label || project.group));
    meta.append(create("span", "project-status", project.status));
    body.append(meta, create("h3", "", project.title), create("p", "project-subtitle", project.subtitle), create("p", "project-summary", project.summary));

    if (project.role) {
      const role = create("div", "project-role");
      role.append(create("span", "", "Моя работа"), create("strong", "", project.role));
      body.append(role);
    }

    const tags = create("div", "project-tags");
    project.tags.forEach((tag) => tags.append(create("span", "tag", tag)));
    body.append(tags);

    if (!project.placeholder) {
      const footer = create("div", "project-footer");
      const details = create("button", "project-details", "Подробнее");
      details.type = "button";
      details.addEventListener("click", () => openProjectModal(project));
      footer.append(details);

      if (links.length) {
        const linkList = create("div", "project-link-list");
        links.slice(0, 2).forEach((link) => linkList.append(createExternalLink(link, true)));
        footer.append(linkList);
      }
      body.append(footer);
    }

    card.append(body);
    return card;
  };

  const groupsRoot = $("[data-project-groups]");
  const filtersRoot = $("[data-project-filters]");
  let activeFilter = "all";

  const renderGroups = () => {
    const fragment = document.createDocumentFragment();
    data.groups.forEach((group) => {
      const projects = data.projects.filter((project) => project.group === group.id);
      if (!projects.length) return;

      const section = create("section", "project-group");
      section.dataset.groupId = group.id;
      const heading = create("div", "project-group-heading reveal");
      const copy = create("div");
      copy.append(create("span", "project-group-kicker", group.label), create("h3", "", group.title));
      heading.append(copy, create("p", "", group.description));

      const grid = create("div", "project-grid");
      projects.forEach((project) => grid.append(createProjectCard(project)));
      section.append(heading, grid);
      fragment.append(section);
    });
    groupsRoot.replaceChildren(fragment);
  };

  const applyFilter = (filterId) => {
    activeFilter = filterId;
    $$(".filter-button", filtersRoot).forEach((button) => {
      const active = button.dataset.filter === filterId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    $$(".project-card", groupsRoot).forEach((card) => {
      const categories = card.dataset.categories.split(" ");
      card.hidden = filterId !== "all" && !categories.includes(filterId);
    });

    $$(".project-group", groupsRoot).forEach((group) => {
      group.hidden = !$$('.project-card', group).some((card) => !card.hidden);
    });
  };

  const renderFilters = () => {
    const fragment = document.createDocumentFragment();
    data.filters.forEach((filter) => {
      const button = create("button", "filter-button", filter.label);
      button.type = "button";
      button.dataset.filter = filter.id;
      button.setAttribute("aria-pressed", String(filter.id === activeFilter));
      button.classList.toggle("is-active", filter.id === activeFilter);
      button.addEventListener("click", () => applyFilter(filter.id));
      fragment.append(button);
    });
    filtersRoot.replaceChildren(fragment);
  };

  const renderStack = () => {
    const root = $("[data-stack]");
    const fragment = document.createDocumentFragment();
    data.stack.forEach((group) => {
      const card = create("article", "stack-card reveal");
      card.append(create("h3", "", group.title));
      const items = create("div", "stack-items");
      group.items.forEach((item) => items.append(create("span", "", item)));
      card.append(items);
      fragment.append(card);
    });
    root.replaceChildren(fragment);
  };

  const setupNavigation = () => {
    const header = $("[data-header]");
    const nav = $("[data-nav]");
    const toggle = $("[data-nav-toggle]");
    const close = () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", close);
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
  };

  const setupTicker = () => {
    const track = $("[data-ticker]");
    if (!track) return;
    track.insertAdjacentHTML("beforeend", track.innerHTML);
  };

  const setupReveal = () => {
    const elements = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px" });
    elements.forEach((element) => observer.observe(element));
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!galleryModal.hidden) closeGallery();
      else if (!projectModal.hidden) closeProjectModal();
    }
    if (!galleryModal.hidden && event.key === "ArrowLeft") stepGallery(-1);
    if (!galleryModal.hidden && event.key === "ArrowRight") stepGallery(1);
  });

  renderFilters();
  renderGroups();
  renderStack();
  setupNavigation();
  setupTicker();
  setupReveal();
})();
