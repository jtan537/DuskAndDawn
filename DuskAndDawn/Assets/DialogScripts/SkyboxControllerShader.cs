using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SkyboxControllerShader : MonoBehaviour
{
	public Material test;

	// float lerpTime = 1f;
    // float currentLerpTime = 0f;

    bool isDusk = true;
    bool Dusk2Dawn = false;
    bool Dawn2Dusk = true;

    public float blend = 0f;

    // Start is called before the first frame update
    void Start()
    {
        test.SetFloat("_Blend", 0);
        RenderSettings.skybox = test;
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("r")) {
            if (isDusk)
            {
                Dusk2Dawn = true;
                isDusk = false;
            }
            else
            {
                Dawn2Dusk = true;
                isDusk = true;
            }
        }
 		
 		if (Dusk2Dawn)
 		{
            if (blend <= 1f)
            {
                blend += 0.6f * Time.deltaTime;
                test.SetFloat("_Blend", blend);
            }

            if (blend >= 1f)
            {
                Dusk2Dawn = false;
            }
	    }

        if (Dawn2Dusk)
        {
            if (blend >= 0f)
            {
                blend -= 0.6f * Time.deltaTime;
                test.SetFloat("_Blend", blend);
            }

            if (blend <= 0f)
            {
                Dawn2Dusk = false;
            }
        }

        // other methods
        // increment timer once per frame
        // currentLerpTime += Time.deltaTime;
        // if (currentLerpTime > lerpTime * 15) {
        //     currentLerpTime = lerpTime * 15;
        //     enable = false;
        // }
 
        // //lerp!
        // float perc = currentLerpTime / lerpTime;
        // test.SetFloat("_Blend" , Mathf.Lerp(test.GetFloat("_Blend"),1,perc / 15));
    }
}
