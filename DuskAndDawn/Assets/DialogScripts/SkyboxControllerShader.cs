using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SkyboxControllerShader : MonoBehaviour
{
	public Material test;

	// float lerpTime = 1f;
    // float currentLerpTime = 0f;

    bool Dusk2Dawn = false;
    bool Dawn2Dusk = false;

    public float blend = 0f;

    // Start is called before the first frame update
    void Start()
    {
        test.SetFloat("_Blend", 0);
        RenderSettings.skybox = test;
    }

    // Update is called once per frame
    public void DuskToDawn()
    {
        Dusk2Dawn = true;
        Debug.Log("dusktodawn");
    }

    public void DawnToDusk()
    {
        Dawn2Dusk = true;
        Debug.Log("dawntodusk");
    }

    void Update()
    {
 		
 		if (Dawn2Dusk)
 		{
            if (blend <= 1f)
            {
                blend += 0.6f * Time.deltaTime;
                test.SetFloat("_Blend", blend);
            }

            if (blend >= 1f)
            {
                Dawn2Dusk = false;
            }
	    }

        if (Dusk2Dawn)
        {
            if (blend >= 0f)
            {
                blend -= 0.6f * Time.deltaTime;
                test.SetFloat("_Blend", blend);
            }

            if (blend <= 0f)
            {
                Dusk2Dawn = false;
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
