// src/utils/useInViewMotion.js
import { useInView } from "framer-motion";
import { useRef } from "react"

const useInViewMotion = (options = { once: true, amout: 0.2 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, options);
    return { ref, inView };
}

export default useInViewMotion;