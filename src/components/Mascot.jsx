import React, { useId } from 'react';
import './identity.css';

/* ARCHIVED � nothing imports this file.

   This is the hand-drawn vector loaf Monty had before the companions were
   redrawn as pixel sprites (components/Pets.jsx). It is kept because this
   handoff has no version control, so deleting it would lose the artwork for
   good. Delete it once the pixel cast is settled.

   Monty's little loaf: the same three-lobed crust, inset crumb and neckerchief
   in every state. The lighting is painted into the SVG, with no runtime loop.
   Its animation classes refer to rules identity.css no longer carries, so it
   would need those back before it could be used again. */
export default function Mascot({ mood = 'hello', className = '', size = 150 }) {
  const id = `monty-${useId().replace(/:/g, '')}`;
  const paint = name => `url(#${id}-${name})`;
  const happy = mood === 'success';
  const thoughtful = mood === 'empty';

  return <svg className={`monty-mascot pet-loaf ${className}`.trim()} width={size} height={size} viewBox="0 0 180 180" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-crust`} x1="52" y1="27" x2="138" y2="144" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F7D298"/><stop offset=".36" stopColor="#ECC082"/><stop offset=".74" stopColor="#D9995B"/><stop offset="1" stopColor="#B77A4D"/>
      </linearGradient>
      <linearGradient id={`${id}-side`} x1="91" y1="54" x2="139" y2="148" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C58D59"/><stop offset="1" stopColor="#9F6948"/>
      </linearGradient>
      <radialGradient id={`${id}-crumb`} cx="0" cy="0" r="1" gradientTransform="translate(74 66) rotate(63) scale(92 72)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF5D6"/><stop offset=".6" stopColor="#F7E9BD"/><stop offset="1" stopColor="#E6C991"/>
      </radialGradient>
      <linearGradient id={`${id}-scarf`} x1="61" y1="129" x2="122" y2="152" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E6DDF3"/><stop offset=".48" stopColor="#C7B3DC"/><stop offset="1" stopColor="#9471AA"/>
      </linearGradient>
      <radialGradient id={`${id}-shadow`} cx=".5" cy=".5" r=".5">
        <stop stopColor="#785783" stopOpacity=".22"/><stop offset="1" stopColor="#785783" stopOpacity="0"/>
      </radialGradient>
    </defs>

    <ellipse className="pet-shadow" cx="92" cy="159" rx="58" ry="11" fill={paint('shadow')}/>
    <g className="pet-bob">
      <path d="M68 140c-2 7-9 8-10 13-1 5 12 6 17 2 4-4 3-11 3-15" fill="#785783"/>
      <path d="M108 139c-1 9 3 12 8 15 6 4 16 0 11-4l-10-12" fill="#654670"/>

      {happy ? <>
        <path d="M45 101c-11-4-16-12-17-21" stroke="#D69C65" strokeWidth="10" strokeLinecap="round"/>
        <path d="M135 101c12-5 17-13 18-23" stroke="#C38958" strokeWidth="10" strokeLinecap="round"/>
        <path d="M22 72c-5-2-7-6-7-11 4 2 7 5 7 11Zm133-12c3-5 6-7 10-7-1 4-4 6-10 7Z" fill="#B197C6"/>
      </> : thoughtful ? <>
        <path d="M46 105c-12 3-15 10-11 15" stroke="#D69C65" strokeWidth="10" strokeLinecap="round"/>
        <path d="M135 109c13 3 13-8 5-13" stroke="#C38958" strokeWidth="10" strokeLinecap="round"/>
      </> : <>
        <path d="M46 105c-10 3-15 8-17 14" stroke="#D69C65" strokeWidth="10" strokeLinecap="round"/>
        <path d="M135 103c15-1 18-13 17-22" stroke="#C38958" strokeWidth="10" strokeLinecap="round"/>
        <path d="m149 82-3-5m7 5 3-5" stroke="#C38958" strokeWidth="5" strokeLinecap="round"/>
      </>}

      <path d="M48 71C30 53 43 32 62 36c11-14 29-13 40-5 26-7 49 7 47 27-1 9-6 16-11 20l-1 55c0 12-10 18-42 18-32 0-45-6-46-17Z" fill={paint('side')}/>
      <path d="M41 66C24 50 36 28 58 31c10-14 30-14 41-4 27-7 47 8 44 28-1 8-6 14-12 18v55c0 11-12 18-44 18-30 0-44-6-44-17Z" fill={paint('crust')}/>
      <path d="M41 49c0-11 10-18 24-16 9-10 24-11 35-2" stroke="#FFE2B0" strokeWidth="3" strokeLinecap="round" opacity=".75"/>
      <path d="M53 66c-10-13-1-23 13-20 9-11 22-10 30-2 18-4 31 5 28 17-1 5-5 9-10 12v49c0 7-10 11-27 11-20 0-30-4-30-11V73Z" fill="#BA8556" opacity=".35"/>
      <path d="M51 64c-8-12 1-22 14-18 9-12 22-11 30-3 18-4 31 4 28 16-1 5-5 9-10 12v49c0 7-10 11-27 11-20 0-31-4-31-11V71Z" fill={paint('crumb')}/>
      <path d="M59 55c3-3 8-5 13-4" stroke="#FFF8DF" strokeWidth="3" strokeLinecap="round" opacity=".8"/>

      <g fill="#CAA771" opacity=".32">
        <ellipse cx="63" cy="77" rx="1.5" ry="2"/><circle cx="108" cy="74" r="1.3"/><circle cx="63" cy="115" r="1.5"/><ellipse cx="100" cy="121" rx="2" ry="1.3"/>
      </g>
      <ellipse cx="66" cy="101" rx="6.5" ry="3.8" fill="#EBAE98" opacity=".75"/>
      <ellipse cx="106" cy="101" rx="6.5" ry="3.8" fill="#EBAE98" opacity=".75"/>
      <g stroke="#47304F" strokeWidth="3.4" strokeLinecap="round">
        {happy ? <><path d="M71 91q3-5 6 0m17 0q3-5 6 0"/><path d="M81 102q5 9 11 0"/></> : <>
          {/* Only the eyes go in the blinking group; the mouth has to hold still. */}
          <g className="pet-blink"><path d={thoughtful ? 'M74 92v3m23-4v3' : 'M74 90v4m23-4v4'}/></g>
          <path d={thoughtful ? 'M83 106q4 2 7-1' : 'M81 103q5 5 11 0'}/>
        </>}
      </g>

      <path d="M52 126c18 9 42 11 66 0l-1 10c-20 12-44 10-64 0Z" fill="#866098" opacity=".25"/>
      <path d="M52 125c17 9 42 11 66 0l-1 8c-20 12-44 10-64 0Z" fill={paint('scarf')}/>
      <path d="M105 134c5 3 7 12 5 22l-8-5-5 3c-2-9-1-15 2-20" fill={paint('scarf')}/>
      <path d="M103 136c4 7 4 11 4 14" stroke="#9471AA" strokeWidth="1.5" strokeLinecap="round" opacity=".65"/>
      <ellipse cx="103" cy="134" rx="7" ry="5.5" fill="#C7B3DC"/>
      <path d="M55 127c12 5 21 7 31 7" stroke="#EFE8F7" strokeWidth="1.7" strokeLinecap="round" opacity=".85"/>
    </g>
  </svg>;
}
