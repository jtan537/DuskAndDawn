using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class skyboxchange : MonoBehaviour
{

	public Material test;

	[Range(0.00f, 1.00f)]

	public float blend = 0f;

    // Update is called once per frame
    void Update()
    {
        if (blend <= 1f)
        {
        	blend += 0.01f * Time.deltaTime;
        	test.SetFloat("_Blend", blend);
        }

        if (blend >= 1f)
        {
        	blend -= 0.01f * Time.deltaTime;
        	test.SetFloat("_Blend", blend);
        }
    }
}
